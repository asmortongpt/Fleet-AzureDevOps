#!/usr/bin/env node
/**
 * PARALLEL SEED Worker 1: Core Entities (FAST)
 * Creates: Tenants, Users, Drivers, Facilities
 * Uses BATCH INSERTS for maximum performance
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config({ path: '../.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '15432'),
  database: process.env.DB_NAME || 'fleetdb',
  user: process.env.DB_USER || 'fleetadmin',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

const floridaCities = [
  { name: 'Miami', lat: 25.7617, lng: -80.1918 },
  { name: 'Tampa', lat: 27.9506, lng: -82.4572 },
  { name: 'Jacksonville', lat: 30.3322, lng: -81.6557 },
  { name: 'Orlando', lat: 28.5383, lng: -81.3792 },
  { name: 'Tallahassee', lat: 30.4383, lng: -84.2807 }
];

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function yearsAgo(years: number): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date;
}

function monthsAgo(months: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date;
}

function generatePhoneNumber(): string {
  return `${randomInt(200, 999)}-${randomInt(200, 999)}-${randomInt(1000, 9999)}`;
}

async function seedCoreEntities() {
  const client = await pool.connect();

  try {
    console.log('🚀 [Worker 1] Starting CORE ENTITIES seed (BATCH MODE)...\n');
    await client.query('BEGIN');

    const defaultPassword = await bcrypt.hash('TestPassword123!', 12);

    // ========================================
    // 1. TENANTS - Batch Insert
    // ========================================
    console.log('📦 Creating tenants...');

    const tenantConfigs = [
      { name: 'Small Fleet Transport', domain: 'small-fleet.local', tier: 'basic', vehicleCount: 8, settings: { timezone: 'America/New_York', features: ['basic_tracking', 'maintenance'] } },
      { name: 'Medium Logistics Company', domain: 'medium-logistics.local', tier: 'professional', vehicleCount: 35, settings: { timezone: 'America/New_York', features: ['advanced_tracking', 'maintenance', 'fuel_management', 'routing'] } },
      { name: 'Enterprise Fleet Services', domain: 'enterprise-fleet.local', tier: 'enterprise', vehicleCount: 120, settings: { timezone: 'America/New_York', features: ['all'] } },
      { name: 'Demo Account - Showcase', domain: 'demo-showcase.local', tier: 'demo', vehicleCount: 25, settings: { timezone: 'America/New_York', features: ['all'], demo_mode: true } },
      { name: 'Test Tenant (Inactive)', domain: 'test-inactive.local', tier: 'test', vehicleCount: 5, settings: { timezone: 'America/New_York' } }
    ];

    const tenantsResult = await client.query(
      `INSERT INTO tenants (name, domain, settings, is_active)
       VALUES
         ('Small Fleet Transport', 'small-fleet.local', '{"timezone":"America/New_York","features":["basic_tracking","maintenance"]}'::jsonb, true),
         ('Medium Logistics Company', 'medium-logistics.local', '{"timezone":"America/New_York","features":["advanced_tracking","maintenance","fuel_management","routing"]}'::jsonb, true),
         ('Enterprise Fleet Services', 'enterprise-fleet.local', '{"timezone":"America/New_York","features":["all"]}'::jsonb, true),
         ('Demo Account - Showcase', 'demo-showcase.local', '{"timezone":"America/New_York","features":["all"],"demo_mode":true}'::jsonb, true),
         ('Test Tenant (Inactive)', 'test-inactive.local', '{"timezone":"America/New_York"}'::jsonb, false)
       ON CONFLICT (domain) DO UPDATE SET name = EXCLUDED.name
       RETURNING *`
    );

    const tenants = tenantsResult.rows.map((row, idx) => ({ ...row, ...tenantConfigs[idx] }));
    console.log(`   ✅ Created ${tenants.length} tenants`);

    // ========================================
    // 2. USERS - Batch by Tenant
    // ========================================
    console.log('👥 Creating users (batch mode)...');

    let totalUsers = 0;
    const allUsers = [];

    for (const tenant of tenants) {
      const userValues = [];
      const userParams: any[] = [];
      let paramIndex = 1;

      // Admin
      userValues.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
      userParams.push(tenant.id, `admin@${tenant.domain}`, defaultPassword, 'Admin', 'User', generatePhoneNumber(), 'admin', true, 0, true);

      // Fleet Managers
      const fmCount = tenant.tier === 'enterprise' ? 5 : tenant.tier === 'professional' ? 3 : 2;
      for (let i = 1; i <= fmCount; i++) {
        const isActive = i < fmCount || Math.random() < 0.9;
        userValues.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
        userParams.push(tenant.id, `manager${i}@${tenant.domain}`, defaultPassword, 'Fleet', `Manager ${i}`, generatePhoneNumber(), 'fleet_manager', isActive, isActive ? daysAgo(randomInt(0, 7)) : null);
      }

      // Technicians
      const techCount = tenant.tier === 'enterprise' ? 8 : tenant.tier === 'professional' ? 4 : 2;
      for (let i = 1; i <= techCount; i++) {
        userValues.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
        userParams.push(tenant.id, `tech${i}@${tenant.domain}`, defaultPassword, 'Technician', `${i}`, generatePhoneNumber(), 'technician', true);
      }

      // Drivers
      const driverCount = Math.ceil(tenant.vehicleCount * 0.7);
      for (let i = 1; i <= driverCount; i++) {
        const isActive = Math.random() < 0.9;
        const failedLogins = isActive ? 0 : randomInt(0, 5);
        userValues.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
        userParams.push(tenant.id, `driver${i}@${tenant.domain}`, defaultPassword, 'Driver', `${i}`, generatePhoneNumber(), 'driver', isActive, failedLogins, isActive ? daysAgo(randomInt(0, 30)) : null, failedLogins >= 5 ? daysFromNow(1) : null);
      }

      // Viewers
      const viewerCount = tenant.tier === 'enterprise' ? 2 : 1;
      for (let i = 1; i <= viewerCount; i++) {
        userValues.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
        userParams.push(tenant.id, `viewer${i}@${tenant.domain}`, defaultPassword, 'Viewer', `${i}`, generatePhoneNumber(), 'viewer', true);
      }

      // Edge cases
      userValues.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
      userParams.push(tenant.id, `newuser@${tenant.domain}`, defaultPassword, 'New', 'User', generatePhoneNumber(), 'driver', true, daysAgo(0));

      userValues.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
      userParams.push(tenant.id, `inactive@${tenant.domain}`, defaultPassword, 'Inactive', 'User', generatePhoneNumber(), 'driver', false, monthsAgo(7));

      userValues.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
      userParams.push(tenant.id, `suspended@${tenant.domain}`, defaultPassword, 'Suspended', 'User', generatePhoneNumber(), 'driver', false, daysFromNow(30), 5);

      // Batch insert users
      const usersResult = await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active, failed_login_attempts, last_login_at, account_locked_until, mfa_enabled, created_at)
         VALUES ${userValues.join(', ')}
         ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name
         RETURNING *`,
        userParams
      );

      allUsers.push(...usersResult.rows);
      totalUsers += usersResult.rows.length;
    }

    console.log(`   ✅ Created ${totalUsers} users`);

    // ========================================
    // 3. DRIVERS - Batch Insert
    // ========================================
    console.log('🚗 Creating driver profiles (batch mode)...');

    const driverUsers = allUsers.filter(u => u.role === 'driver');
    const driverStatuses = ['active', 'on_leave', 'suspended', 'terminated'];
    const cdlClasses = ['A', 'B', 'C', null];
    const cdlEndorsements = [['H'], ['N'], ['P'], ['T'], ['H', 'N'], ['H', 'N', 'T'], ['P', 'N'], []];

    const driverValues = [];
    const driverParams: any[] = [];
    let driverParamIndex = 1;

    for (const driverUser of driverUsers) {
      const status = randomItem(driverStatuses);
      const cdlClass = randomItem(cdlClasses);
      const endorsements = cdlClass ? randomItem(cdlEndorsements) : [];
      const hireDate = yearsAgo(randomInt(0, 15));
      const terminationDate = status === 'terminated' ? daysAgo(randomInt(30, 365)) : null;
      const licenseExpiration = status === 'terminated' ? daysAgo(randomInt(1, 365)) : daysFromNow(randomInt(-30, 730));
      const medicalExpiration = status === 'terminated' ? daysAgo(randomInt(1, 365)) : daysFromNow(randomInt(-15, 365));
      const safetyScore = status === 'suspended' ? randomFloat(50, 79) : randomFloat(80, 100);

      driverValues.push(`($${driverParamIndex++}, $${driverParamIndex++}, $${driverParamIndex++}, $${driverParamIndex++}, $${driverParamIndex++}, $${driverParamIndex++}, $${driverParamIndex++}, $${driverParamIndex++}, $${driverParamIndex++}, $${driverParamIndex++}, $${driverParamIndex++}, $${driverParamIndex++}, $${driverParamIndex++}, $${driverParamIndex++}, $${driverParamIndex++}, $${driverParamIndex++}, $${driverParamIndex++}, $${driverParamIndex++})`);
      driverParams.push(
        driverUser.tenant_id,
        driverUser.id,
        `FL${randomInt(100000000, 999999999)}`,
        'FL',
        licenseExpiration,
        cdlClass,
        endorsements,
        medicalExpiration,
        hireDate,
        terminationDate,
        status,
        safetyScore,
        randomFloat(5000, 500000),
        randomFloat(200, 10000),
        status === 'suspended' ? randomInt(2, 5) : randomInt(0, 2),
        status === 'suspended' ? randomInt(1, 4) : randomInt(0, 1),
        `Emergency Contact ${randomInt(1, 100)}`,
        generatePhoneNumber()
      );
    }

    const driversResult = await client.query(
      `INSERT INTO drivers (
        tenant_id, user_id, license_number, license_state, license_expiration,
        cdl_class, cdl_endorsements, medical_card_expiration, hire_date, termination_date,
        status, safety_score, total_miles_driven, total_hours_driven, incidents_count, violations_count,
        emergency_contact_name, emergency_contact_phone
      ) VALUES ${driverValues.join(', ')}
      RETURNING *`,
      driverParams
    );

    console.log(`   ✅ Created ${driversResult.rows.length} driver profiles`);

    // ========================================
    // 4. FACILITIES - Batch Insert
    // ========================================
    console.log('🏢 Creating facilities (batch mode)...');

    const facilityValues = [];
    const facilityParams: any[] = [];
    let facilityParamIndex = 1;

    for (const tenant of tenants) {
      const facilityCount = tenant.tier === 'enterprise' ? 6 : tenant.tier === 'professional' ? 3 : 2;

      for (let i = 0; i < facilityCount; i++) {
        const city = randomItem(floridaCities);
        const types = ['garage', 'depot', 'service_center'];
        const type = randomItem(types);
        const isActive = Math.random() < 0.95;

        facilityValues.push(`($${facilityParamIndex++}, $${facilityParamIndex++}, $${facilityParamIndex++}, $${facilityParamIndex++}, $${facilityParamIndex++}, $${facilityParamIndex++}, $${facilityParamIndex++}, $${facilityParamIndex++}, $${facilityParamIndex++}, $${facilityParamIndex++}, $${facilityParamIndex++}, $${facilityParamIndex++}, $${facilityParamIndex++})`);
        facilityParams.push(
          tenant.id,
          `${city.name} ${type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}`,
          type,
          `${randomInt(100, 9999)} ${randomItem(['Main', 'Industrial', 'Commerce', 'Fleet'])} Blvd`,
          city.name,
          'FL',
          `${randomInt(30000, 34999)}`,
          city.lat + randomFloat(-0.05, 0.05, 6),
          city.lng + randomFloat(-0.05, 0.05, 6),
          generatePhoneNumber(),
          randomInt(20, 200),
          type === 'service_center' ? randomInt(4, 20) : randomInt(0, 4),
          isActive
        );
      }
    }

    const facilitiesResult = await client.query(
      `INSERT INTO facilities (
        tenant_id, name, facility_type, address, city, state, zip_code,
        latitude, longitude, phone, capacity, service_bays, is_active
      ) VALUES ${facilityValues.join(', ')}
      RETURNING *`,
      facilityParams
    );

    console.log(`   ✅ Created ${facilitiesResult.rows.length} facilities`);

    await client.query('COMMIT');

    console.log('\n✅ [Worker 1] CORE ENTITIES seed complete!\n');
    console.log('Summary:');
    console.log(`  - Tenants: ${tenants.length}`);
    console.log(`  - Users: ${totalUsers}`);
    console.log(`  - Drivers: ${driversResult.rows.length}`);
    console.log(`  - Facilities: ${facilitiesResult.rows.length}`);
    console.log(`  - Total: ${tenants.length + totalUsers + driversResult.rows.length + facilitiesResult.rows.length} records\n`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding core entities:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedCoreEntities()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
