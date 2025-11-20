#!/usr/bin/env node
/**
 * ULTRA-FAST Test Data Seed - Uses BATCH INSERTS
 * Target: 5,000+ records in under 2 minutes
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

// Utility functions
const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number, decimals = 2): number => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
const daysAgo = (days: number): Date => new Date(Date.now() - days * 86400000);
const daysFromNow = (days: number): Date => new Date(Date.now() + days * 86400000);
const yearsAgo = (years: number): Date => new Date(new Date().setFullYear(new Date().getFullYear() - years));
const monthsAgo = (months: number): Date => new Date(new Date().setMonth(new Date().getMonth() - months));
const generatePhoneNumber = (): string => `${randomInt(200, 999)}-${randomInt(200, 999)}-${randomInt(1000, 9999)}`;
const generateVIN = (): string => {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  return Array.from({ length: 17 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};
const generatePlate = (): string => `FL${randomInt(100, 999)}${String.fromCharCode(65 + randomInt(0, 25))}${String.fromCharCode(65 + randomInt(0, 25))}${String.fromCharCode(65 + randomInt(0, 25))}`;

const floridaCities = [
  { name: 'Miami', lat: 25.7617, lng: -80.1918 },
  { name: 'Tampa', lat: 27.9506, lng: -82.4572 },
  { name: 'Jacksonville', lat: 30.3322, lng: -81.6557 },
  { name: 'Orlando', lat: 28.5383, lng: -81.3792 },
  { name: 'Tallahassee', lat: 30.4383, lng: -84.2807 },
  { name: 'Fort Lauderdale', lat: 26.1224, lng: -80.1373 },
  { name: 'West Palm Beach', lat: 26.7153, lng: -80.0534 },
  { name: 'Naples', lat: 26.1420, lng: -81.7948 },
  { name: 'Gainesville', lat: 29.6516, lng: -82.3248 },
  { name: 'Pensacola', lat: 30.4213, lng: -87.2169 }
];

const vehicleTemplates = [
  { make: 'Honda', model: 'Accord', type: 'Sedan', fuelType: 'Gasoline', weight: 'light' },
  { make: 'Toyota', model: 'Camry', type: 'Sedan', fuelType: 'Gasoline', weight: 'light' },
  { make: 'Tesla', model: 'Model 3', type: 'Sedan', fuelType: 'Electric', weight: 'light' },
  { make: 'Ford', model: 'F-150', type: 'Pickup Truck', fuelType: 'Gasoline', weight: 'medium' },
  { make: 'Ford', model: 'F-250 Super Duty', type: 'Pickup Truck', fuelType: 'Diesel', weight: 'heavy' },
  { make: 'Chevrolet', model: 'Silverado 1500', type: 'Pickup Truck', fuelType: 'Gasoline', weight: 'medium' },
  { make: 'RAM', model: '2500', type: 'Pickup Truck', fuelType: 'Diesel', weight: 'heavy' },
  { make: 'Ford', model: 'Transit', type: 'Cargo Van', fuelType: 'Diesel', weight: 'medium' },
  { make: 'Mercedes-Benz', model: 'Sprinter', type: 'Cargo Van', fuelType: 'Diesel', weight: 'medium' },
  { make: 'Freightliner', model: 'Cascadia', type: 'Semi-Truck', fuelType: 'Diesel', weight: 'heavy' },
  { make: 'Tesla', model: 'Semi', type: 'Semi-Truck', fuelType: 'Electric', weight: 'heavy' },
  { make: 'Isuzu', model: 'NPR', type: 'Box Truck', fuelType: 'Diesel', weight: 'heavy' }
];

const maintenanceTypes = [
  'Oil Change', 'Tire Rotation', 'Brake Inspection', 'Battery Replacement',
  'Transmission Service', 'AC System Service', 'DOT Safety Inspection',
  'State Inspection', 'Engine Tune-up', 'Brake Pad Replacement'
];

async function seedUltraFast() {
  const client = await pool.connect();
  const startTime = Date.now();

  try {
    console.log('\n🚀 ULTRA-FAST SEED STARTING...\n');
    await client.query('BEGIN');

    const defaultPassword = await bcrypt.hash('TestPassword123!', 10);
    let totalRecords = 0;

    // ========== TENANTS ==========
    console.log('📦 Tenants...');
    const tenantsResult = await client.query(`
      INSERT INTO tenants (name, domain, settings, is_active) VALUES
        ('Small Fleet Transport', 'small-fleet.local', '{"timezone":"America/New_York"}'::jsonb, true),
        ('Medium Logistics', 'medium-logistics.local', '{"timezone":"America/New_York"}'::jsonb, true),
        ('Enterprise Fleet', 'enterprise-fleet.local', '{"timezone":"America/New_York"}'::jsonb, true)
      ON CONFLICT (domain) DO UPDATE SET name = EXCLUDED.name
      RETURNING *
    `);
    const tenants = tenantsResult.rows;
    totalRecords += tenants.length;
    console.log(`   ✅ ${tenants.length} tenants`);

    // ========== USERS (Batch) ==========
    console.log('👥 Users...');
    const allUsers = [];

    for (const tenant of tenants) {
      const userCount = tenant.domain.includes('small') ? 10 : tenant.domain.includes('medium') ? 30 : 100;
      const userValues: string[] = [];

      for (let i = 0; i < userCount; i++) {
        const role = i === 0 ? 'admin' : i < 3 ? 'fleet_manager' : i < 8 ? 'technician' : 'driver';
        const email = `${role}${i}@${tenant.domain}`;
        const isActive = Math.random() < 0.9;
        userValues.push(`(
          '${tenant.id}', '${email}', '${defaultPassword}',
          '${role.charAt(0).toUpperCase() + role.slice(1)}', 'User${i}', '${generatePhoneNumber()}',
          '${role}', ${isActive}, 0, ${isActive ? `'${daysAgo(randomInt(0, 30)).toISOString()}'` : 'NULL'}
        )`);
      }

      const usersResult = await client.query(`
        INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active, failed_login_attempts, last_login_at)
        VALUES ${userValues.join(', ')}
        ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name
        RETURNING *
      `);
      allUsers.push(...usersResult.rows);
      totalRecords += usersResult.rows.length;
    }
    console.log(`   ✅ ${allUsers.length} users`);

    // ========== DRIVERS (Batch) ==========
    console.log('🚗 Drivers...');
    const driverUsers = allUsers.filter(u => u.role === 'driver');
    const driverStatuses = ['active', 'on_leave', 'suspended'];
    const cdlClasses = ['A', 'B', 'C', null];

    const driverValues: string[] = [];
    for (const driverUser of driverUsers) {
      const status = randomItem(driverStatuses);
      const cdlClass = randomItem(cdlClasses);
      driverValues.push(`(
        '${driverUser.tenant_id}', '${driverUser.id}', 'FL${randomInt(100000000, 999999999)}', 'FL',
        '${daysFromNow(randomInt(30, 730)).toISOString()}', ${cdlClass ? `'${cdlClass}'` : 'NULL'},
        '{}', '${daysFromNow(randomInt(30, 365)).toISOString()}', '${yearsAgo(randomInt(1, 10)).toISOString()}',
        NULL, '${status}', ${randomFloat(75, 100)}, ${randomFloat(10000, 200000)},
        ${randomFloat(500, 5000)}, ${randomInt(0, 2)}, ${randomInt(0, 1)},
        'Emergency Contact', '${generatePhoneNumber()}'
      )`);
    }

    await client.query(`
      INSERT INTO drivers (
        tenant_id, user_id, license_number, license_state, license_expiration,
        cdl_class, cdl_endorsements, medical_card_expiration, hire_date, termination_date,
        status, safety_score, total_miles_driven, total_hours_driven, incidents_count, violations_count,
        emergency_contact_name, emergency_contact_phone
      ) VALUES ${driverValues.join(', ')}
    `);
    totalRecords += driverValues.length;
    console.log(`   ✅ ${driverValues.length} drivers`);

    // ========== FACILITIES (Batch) ==========
    console.log('🏢 Facilities...');
    const facilityValues: string[] = [];

    for (const tenant of tenants) {
      const facilityCount = tenant.domain.includes('small') ? 2 : tenant.domain.includes('medium') ? 4 : 8;
      for (let i = 0; i < facilityCount; i++) {
        const city = randomItem(floridaCities);
        const type = randomItem(['garage', 'depot', 'service_center']);
        facilityValues.push(`(
          '${tenant.id}', '${city.name} ${type}', '${type}',
          '${randomInt(100, 9999)} Main St', '${city.name}', 'FL', '${randomInt(30000, 34999)}',
          ${city.lat}, ${city.lng}, '${generatePhoneNumber()}',
          ${randomInt(20, 100)}, ${type === 'service_center' ? randomInt(4, 12) : 0}, true
        )`);
      }
    }

    const facilitiesResult = await client.query(`
      INSERT INTO facilities (
        tenant_id, name, facility_type, address, city, state, zip_code,
        latitude, longitude, phone, capacity, service_bays, is_active
      ) VALUES ${facilityValues.join(', ')}
      RETURNING *
    `);
    totalRecords += facilitiesResult.rows.length;
    console.log(`   ✅ ${facilitiesResult.rows.length} facilities`);

    // ========== VEHICLES (Batch) ==========
    console.log('🚛 Vehicles...');
    const allVehicles = [];
    const vehicleStatuses = ['active', 'maintenance', 'out_of_service'];

    // Tallahassee coordinates for all vehicles
    const tallahassee = { name: 'Tallahassee', lat: 30.4383, lng: -84.2807 };

    for (const tenant of tenants) {
      const vehicleCount = tenant.domain.includes('small') ? 10 : tenant.domain.includes('medium') ? 40 : 150;
      const tenantDrivers = allUsers.filter(u => u.tenant_id === tenant.id && u.role === 'driver' && u.is_active);
      const vehicleValues: string[] = [];

      for (let i = 0; i < vehicleCount; i++) {
        const template = randomItem(vehicleTemplates);
        const year = randomInt(2018, 2025);
        const status = randomItem(vehicleStatuses);
        const odometer = (2025 - year) * randomInt(10000, 25000);
        const assignedDriver = tenantDrivers.length > 0 && Math.random() < 0.7 ? randomItem(tenantDrivers).id : null;
        // Spread vehicles around Tallahassee area (within ~10 mile radius)
        const city = {
          name: 'Tallahassee',
          lat: tallahassee.lat + randomFloat(-0.15, 0.15, 6),
          lng: tallahassee.lng + randomFloat(-0.15, 0.15, 6)
        };

        vehicleValues.push(`(
          '${tenant.id}', '${generateVIN()}', '${template.make}', '${template.model}',
          ${year}, '${generatePlate()}', '${template.type}', '${template.fuelType}',
          '${status}', ${odometer}, ${template.fuelType === 'Diesel' ? randomFloat(1000, 5000) : 0},
          '${yearsAgo(2025 - year).toISOString()}', ${randomInt(30000, 80000)}, ${randomInt(15000, 60000)},
          ${status === 'active' ? `'GPS-${randomInt(100000, 999999)}'` : 'NULL'},
          ${status === 'active' ? `'${daysAgo(0).toISOString()}'` : 'NULL'},
          ${city.lat}, ${city.lng},
          ${status === 'active' && Math.random() < 0.3 ? randomFloat(0, 75) : 'NULL'},
          ${status === 'active' && Math.random() < 0.3 ? randomInt(0, 359) : 'NULL'},
          ${assignedDriver ? `'${assignedDriver}'` : 'NULL'}, NULL, NULL
        )`);
      }

      const vehiclesResult = await client.query(`
        INSERT INTO vehicles (
          tenant_id, vin, make, model, year, license_plate, vehicle_type, fuel_type,
          status, odometer, engine_hours, purchase_date, purchase_price, current_value,
          gps_device_id, last_gps_update, latitude, longitude, speed, heading,
          assigned_driver_id, assigned_facility_id, notes
        ) VALUES ${vehicleValues.join(', ')}
        RETURNING *
      `);
      allVehicles.push(...vehiclesResult.rows);
      totalRecords += vehiclesResult.rows.length;
    }
    console.log(`   ✅ ${allVehicles.length} vehicles`);

    // ========== WORK ORDERS (Batch) ==========
    console.log('🔧 Work Orders...');
    const workOrderStatuses = ['open', 'in_progress', 'completed'];
    const priorities = ['low', 'medium', 'high', 'critical'];
    const workOrderValues: string[] = [];

    for (const vehicle of allVehicles.slice(0, 500)) { // Limit for speed
      const count = randomInt(1, 3);
      const technicians = allUsers.filter(u => u.tenant_id === vehicle.tenant_id && u.role === 'technician');

      for (let i = 0; i < count; i++) {
        const status = randomItem(workOrderStatuses);
        const serviceType = randomItem(maintenanceTypes);
        const tech = technicians.length > 0 ? randomItem(technicians).id : null;
        const laborHours = status === 'completed' ? randomFloat(1, 8) : 0;
        const laborCost = laborHours * randomFloat(75, 125);

        workOrderValues.push(`(
          '${vehicle.tenant_id}', 'WO-2025-${randomInt(10000, 99999)}', '${vehicle.id}',
          NULL, ${tech ? `'${tech}'` : 'NULL'}, 'corrective', '${randomItem(priorities)}',
          '${status}', '${serviceType}', ${vehicle.odometer - randomInt(0, 1000)}, ${vehicle.engine_hours},
          '${daysAgo(randomInt(1, 30)).toISOString()}', '${daysFromNow(randomInt(1, 30)).toISOString()}',
          ${status !== 'open' ? `'${daysAgo(randomInt(0, 10)).toISOString()}'` : 'NULL'},
          ${status === 'completed' ? `'${daysAgo(randomInt(0, 5)).toISOString()}'` : 'NULL'},
          ${laborHours}, ${laborCost}, ${status === 'completed' ? randomFloat(50, 2000) : 0},
          '${daysAgo(randomInt(1, 60)).toISOString()}'
        )`);
      }
    }

    await client.query(`
      INSERT INTO work_orders (
        tenant_id, work_order_number, vehicle_id, facility_id, assigned_technician_id,
        type, priority, status, description, odometer_reading, engine_hours_reading,
        scheduled_start, scheduled_end, actual_start, actual_end,
        labor_hours, labor_cost, parts_cost, created_at
      ) VALUES ${workOrderValues.join(', ')}
    `);
    totalRecords += workOrderValues.length;
    console.log(`   ✅ ${workOrderValues.length} work orders`);

    // ========== FUEL TRANSACTIONS (Batch - Large) ==========
    console.log('⛽ Fuel Transactions...');
    const fuelVehicles = allVehicles.filter(v => v.fuel_type !== 'Electric');
    const fuelStations = ['Shell', 'BP', 'Chevron', 'Marathon', 'Sunoco', 'RaceTrac'];

    // Process in chunks to avoid too large queries
    const chunkSize = 500;
    let totalFuel = 0;

    for (let i = 0; i < fuelVehicles.length; i += chunkSize) {
      const chunk = fuelVehicles.slice(i, i + chunkSize);
      const fuelValues: string[] = [];

      for (const vehicle of chunk) {
        const transactionsPerVehicle = randomInt(10, 30);

        for (let j = 0; j < transactionsPerVehicle; j++) {
          const daysBack = randomInt(1, 365);
          // Keep fuel transactions in Tallahassee area
          const city = {
            name: 'Tallahassee',
            lat: tallahassee.lat + randomFloat(-0.1, 0.1, 6),
            lng: tallahassee.lng + randomFloat(-0.1, 0.1, 6)
          };
          const gallons = vehicle.vehicle_type.includes('Semi') ? randomFloat(80, 150) : randomFloat(10, 30);
          const pricePerGallon = vehicle.fuel_type === 'Diesel' ? randomFloat(3.89, 4.35) : randomFloat(3.45, 3.89);

          fuelValues.push(`(
            '${vehicle.tenant_id}', '${vehicle.id}', '${daysAgo(daysBack).toISOString()}',
            ${gallons}, ${pricePerGallon}, ${Math.max(0, vehicle.odometer - daysBack * randomInt(30, 100))},
            '${vehicle.fuel_type}', '${randomItem(fuelStations)} - ${city.name}',
            ${city.lat}, ${city.lng}, ${Math.random() < 0.8 ? `'FC${randomInt(1000000, 9999999)}'` : 'NULL'}
          )`);
        }
      }

      if (fuelValues.length > 0) {
        await client.query(`
          INSERT INTO fuel_transactions (
            tenant_id, vehicle_id, transaction_date, gallons, price_per_gallon,
            odometer_reading, fuel_type, location, latitude, longitude, fuel_card_number
          ) VALUES ${fuelValues.join(', ')}
        `);
        totalFuel += fuelValues.length;
      }
    }

    totalRecords += totalFuel;
    console.log(`   ✅ ${totalFuel} fuel transactions`);

    // ========== TELEMETRY DATA (Batch - Large) ==========
    console.log('📡 Telemetry...');
    const telemetryVehicles = allVehicles.filter(v => v.status === 'active' && v.gps_device_id).slice(0, 100);
    let totalTelemetry = 0;

    for (let i = 0; i < telemetryVehicles.length; i += 50) {
      const chunk = telemetryVehicles.slice(i, i + 50);
      const telemetryValues: string[] = [];

      for (const vehicle of chunk) {
        const pointsPerVehicle = randomInt(50, 100);

        for (let j = 0; j < pointsPerVehicle; j++) {
          const daysBack = randomInt(0, 30);
          // Keep telemetry points in Tallahassee area
          const city = {
            name: 'Tallahassee',
            lat: tallahassee.lat + randomFloat(-0.15, 0.15, 6),
            lng: tallahassee.lng + randomFloat(-0.15, 0.15, 6)
          };
          const speed = randomFloat(0, 75);

          telemetryValues.push(`(
            '${vehicle.tenant_id}', '${vehicle.id}', '${daysAgo(daysBack).toISOString()}',
            ${city.lat + randomFloat(-0.1, 0.1, 6)}, ${city.lng + randomFloat(-0.1, 0.1, 6)},
            ${speed}, ${randomInt(0, 359)}, ${vehicle.odometer - randomInt(0, 500)},
            ${randomFloat(20, 100)}, ${speed > 5 ? randomInt(1500, 3000) : randomInt(600, 900)},
            ${randomFloat(180, 210)}, ${randomFloat(12.5, 14.0)},
            ${Math.random() < 0.02}, ${Math.random() < 0.02}, ${speed > 75},
            ${speed < 5 ? randomInt(0, 300) : 0}
          )`);
        }
      }

      if (telemetryValues.length > 0) {
        await client.query(`
          INSERT INTO telemetry_data (
            tenant_id, vehicle_id, timestamp, latitude, longitude, speed, heading,
            odometer, fuel_level, engine_rpm, coolant_temp, battery_voltage,
            harsh_braking, harsh_acceleration, speeding, idle_time
          ) VALUES ${telemetryValues.join(', ')}
        `);
        totalTelemetry += telemetryValues.length;
      }
    }

    totalRecords += totalTelemetry;
    console.log(`   ✅ ${totalTelemetry} telemetry points`);

    await client.query('COMMIT');

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);

    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║  ULTRA-FAST SEED COMPLETE                         ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');
    console.log(`⏱️  Time: ${duration}s`);
    console.log(`📊 Records: ${totalRecords.toLocaleString()}`);
    console.log(`🚀 Speed: ${Math.round(totalRecords / parseFloat(duration))} records/second\n`);
    console.log('Test Credentials:');
    console.log('  Email: admin0@small-fleet.local');
    console.log('  Password: TestPassword123!\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedUltraFast()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
