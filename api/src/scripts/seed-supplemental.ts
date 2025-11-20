#!/usr/bin/env node
/**
 * SUPPLEMENTAL Seed - Adds missing entities
 * Routes, Geofences, Inspections, Incidents, Vendors, etc.
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '15432'),
  database: process.env.DB_NAME || 'fleetdb',
  user: process.env.DB_USER || 'fleetadmin',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number, decimals = 2): number => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
const daysAgo = (days: number): Date => new Date(Date.now() - days * 86400000);
const daysFromNow = (days: number): Date => new Date(Date.now() + days * 86400000);
const generatePhoneNumber = (): string => `${randomInt(200, 999)}-${randomInt(200, 999)}-${randomInt(1000, 9999)}`;

const floridaCities = [
  { name: 'Miami', lat: 25.7617, lng: -80.1918 },
  { name: 'Tampa', lat: 27.9506, lng: -82.4572 },
  { name: 'Jacksonville', lat: 30.3322, lng: -81.6557 },
  { name: 'Orlando', lat: 28.5383, lng: -81.3792 },
  { name: 'Tallahassee', lat: 30.4383, lng: -84.2807 }
];

async function seedSupplemental() {
  const client = await pool.connect();
  const startTime = Date.now();

  try {
    console.log('\n🔧 SUPPLEMENTAL SEED STARTING...\n');
    await client.query('BEGIN');

    let totalRecords = 0;

    // Fetch existing data
    const tenantsResult = await client.query('SELECT 
      id,
      name,
      domain,
      settings,
      is_active,
      created_at,
      updated_at FROM tenants WHERE is_active = true');
    const tenants = tenantsResult.rows;

    const vehiclesResult = await client.query('SELECT 
      id,
      tenant_id,
      vin,
      make,
      model,
      year,
      license_plate,
      vehicle_type,
      fuel_type,
      status,
      odometer,
      engine_hours,
      purchase_date,
      purchase_price,
      current_value,
      gps_device_id,
      last_gps_update,
      latitude,
      longitude,
      location,
      speed,
      heading,
      assigned_driver_id,
      assigned_facility_id,
      telematics_data,
      photos,
      notes,
      created_at,
      updated_at FROM vehicles WHERE assigned_driver_id IS NOT NULL LIMIT 100');
    const vehicles = vehiclesResult.rows;

    const usersResult = await client.query('SELECT 
      id,
      tenant_id,
      email,
      password_hash,
      first_name,
      last_name,
      phone,
      role,
      is_active,
      failed_login_attempts,
      account_locked_until,
      last_login_at,
      mfa_enabled,
      mfa_secret,
      created_at,
      updated_at FROM users WHERE is_active = true');
    const users = usersResult.rows;

    const driversResult = await client.query('SELECT 
      id,
      tenant_id,
      user_id,
      license_number,
      license_state,
      license_expiration,
      cdl_class,
      cdl_endorsements,
      medical_card_expiration,
      hire_date,
      termination_date,
      status,
      safety_score,
      total_miles_driven,
      total_hours_driven,
      incidents_count,
      violations_count,
      emergency_contact_name,
      emergency_contact_phone,
      notes,
      created_at,
      updated_at FROM drivers WHERE status = \'active\'');
    const drivers = driversResult.rows;

    // ========== CHARGING STATIONS ==========
    console.log('🔌 Charging Stations...');
    const stationValues: string[] = [];

    for (const tenant of tenants) {
      for (let i = 0; i < 3; i++) {
        const city = randomItem(floridaCities);
        const type = randomItem(['level_1', 'level_2', 'dc_fast_charge']);
        const powerOutput = type === 'dc_fast_charge' ? randomInt(50, 150) : randomInt(7, 19);

        stationValues.push(`(
          '${tenant.id}', '${city.name} Charging ${i + 1}', '${type}',
          '${randomInt(100, 9999)} ${city.name} Blvd', ${city.lat}, ${city.lng},
          ${randomInt(2, 8)}, ${powerOutput}, ${randomFloat(0.12, 0.25, 4)}, ${Math.random() < 0.3}, true
        )`);
      }
    }

    const stationsResult = await client.query(`
      INSERT INTO charging_stations (
        tenant_id, station_name, station_type, location, latitude, longitude,
        number_of_ports, power_output_kw, cost_per_kwh, is_public, is_operational
      ) VALUES ${stationValues.join(', ')}
      RETURNING *
    `);
    totalRecords += stationsResult.rows.length;
    console.log(`   ✅ ${stationsResult.rows.length} charging stations`);

    // ========== CHARGING SESSIONS ==========
    console.log('⚡ Charging Sessions...');
    const evVehicles = vehicles.filter(v => v.fuel_type === 'Electric');
    const sessionValues: string[] = [];

    for (const ev of evVehicles) {
      const count = randomInt(10, 30);
      const station = randomItem(stationsResult.rows.filter(s => s.tenant_id === ev.tenant_id));

      for (let i = 0; i < count; i++) {
        const startTime = daysAgo(randomInt(1, 90));
        const duration = randomInt(30, 180);
        const endTime = new Date(startTime.getTime() + duration * 60000);
        const energy = randomFloat(15, 80);
        const startBattery = randomFloat(10, 40);

        sessionValues.push(`(
          '${ev.tenant_id}', '${ev.id}', '${station.id}',
          '${startTime.toISOString()}', '${endTime.toISOString()}',
          ${energy}, ${energy * randomFloat(0.12, 0.25)},
          ${startBattery}, ${Math.min(100, startBattery + randomFloat(40, 60))},
          ${duration}, 'completed'
        )`);
      }
    }

    if (sessionValues.length > 0) {
      await client.query(`
        INSERT INTO charging_sessions (
          tenant_id, vehicle_id, charging_station_id, start_time, end_time,
          energy_delivered_kwh, cost, start_battery_level, end_battery_level,
          session_duration, status
        ) VALUES ${sessionValues.join(', ')}
      `);
      totalRecords += sessionValues.length;
      console.log(`   ✅ ${sessionValues.length} charging sessions`);
    }

    // ========== ROUTES ==========
    console.log('🗺️  Routes...');
    const routeValues: string[] = [];

    for (const vehicle of vehicles.slice(0, 50)) {
      const count = randomInt(3, 8);
      // Find the driver record that matches the assigned user
      const assignedDriver = drivers.find(d => d.user_id === vehicle.assigned_driver_id);

      for (let i = 0; i < count; i++) {
        const origin = randomItem(floridaCities);
        const destination = randomItem(floridaCities.filter(c => c.name !== origin.name));
        const status = randomItem(['planned', 'in_progress', 'completed', 'cancelled']);
        const distance = randomFloat(50, 300);
        const estimatedDuration = Math.ceil(distance / 60 * 60);
        const plannedStart = status === 'completed' ? daysAgo(randomInt(1, 60)) : daysFromNow(randomInt(1, 30));
        const plannedEnd = new Date(plannedStart.getTime() + estimatedDuration * 60000);

        routeValues.push(`(
          '${vehicle.tenant_id}', '${origin.name} to ${destination.name}',
          '${vehicle.id}', ${assignedDriver ? `'${assignedDriver.id}'` : 'NULL'}, '${status}',
          '${origin.name}, FL', '${destination.name}, FL',
          '${plannedStart.toISOString()}', '${plannedEnd.toISOString()}',
          ${status === 'completed' || status === 'in_progress' ? `'${plannedStart.toISOString()}'` : 'NULL'},
          ${status === 'completed' ? `'${plannedEnd.toISOString()}'` : 'NULL'},
          ${distance}, ${estimatedDuration},
          ${status === 'completed' ? estimatedDuration + randomInt(-30, 30) : 'NULL'}
        )`);
      }
    }

    await client.query(`
      INSERT INTO routes (
        tenant_id, route_name, vehicle_id, driver_id, status,
        start_location, end_location, planned_start_time, planned_end_time,
        actual_start_time, actual_end_time, total_distance, estimated_duration, actual_duration
      ) VALUES ${routeValues.join(', ')}
    `);
    totalRecords += routeValues.length;
    console.log(`   ✅ ${routeValues.length} routes`);

    // ========== GEOFENCES ==========
    console.log('📍 Geofences...');
    const geofenceValues: string[] = [];

    for (const tenant of tenants) {
      const count = randomInt(8, 15);

      for (let i = 0; i < count; i++) {
        const city = randomItem(floridaCities);
        const type = randomItem(['Customer Site', 'Terminal', 'Restricted Area', 'Service Area', 'Rest Stop']);

        geofenceValues.push(`(
          '${tenant.id}', '${city.name} - ${type}', 'circular',
          ${city.lat + randomFloat(-0.1, 0.1, 6)}, ${city.lng + randomFloat(-0.1, 0.1, 6)},
          ${randomInt(200, 3000)}, ${Math.random() < 0.5}, ${Math.random() < 0.5}, true
        )`);
      }
    }

    await client.query(`
      INSERT INTO geofences (
        tenant_id, name, geofence_type, center_latitude, center_longitude,
        radius, alert_on_entry, alert_on_exit, is_active
      ) VALUES ${geofenceValues.join(', ')}
    `);
    totalRecords += geofenceValues.length;
    console.log(`   ✅ ${geofenceValues.length} geofences`);

    // ========== INSPECTIONS ==========
    console.log('✅ Inspections...');
    const inspectionValues: string[] = [];
    const inspectionTypes = ['pre_trip', 'post_trip', 'safety', 'dot', 'state'];
    const results = ['pass', 'fail', 'needs_repair'];

    for (const vehicle of vehicles) {
      const count = randomInt(8, 20);
      const driver = drivers.find(d => d.user_id === vehicle.assigned_driver_id);

      for (let i = 0; i < count; i++) {
        const type = randomItem(inspectionTypes);
        const result = randomItem(results);

        inspectionValues.push(`(
          '${vehicle.tenant_id}', '${vehicle.id}', ${driver ? `'${driver.id}'` : 'NULL'},
          '${daysAgo(randomInt(1, 365)).toISOString()}', '${type}',
          ${vehicle.odometer - randomInt(0, 5000)}, '${result}',
          '{"completed":true,"notes":"Inspection complete"}'::jsonb,
          ${result !== 'pass' ? `'Minor issues found'` : 'NULL'}
        )`);
      }
    }

    await client.query(`
      INSERT INTO inspections (
        tenant_id, vehicle_id, driver_id, inspection_date, inspection_type,
        odometer_reading, status, form_data, defects_found
      ) VALUES ${inspectionValues.join(', ')}
    `);
    totalRecords += inspectionValues.length;
    console.log(`   ✅ ${inspectionValues.length} inspections`);

    // ========== SAFETY INCIDENTS ==========
    console.log('⚠️  Safety Incidents...');
    const incidentValues: string[] = [];
    const incidentTypes = ['accident', 'injury', 'near_miss', 'property_damage', 'citation'];
    const severities = ['minor', 'moderate', 'severe'];

    const incidentCount = Math.floor(vehicles.length * 0.2);
    for (let i = 0; i < incidentCount; i++) {
      const vehicle = randomItem(vehicles);
      const driver = drivers.find(d => d.user_id === vehicle.assigned_driver_id);
      const type = randomItem(incidentTypes);
      const severity = randomItem(severities);
      const city = randomItem(floridaCities);

      incidentValues.push(`(
        '${vehicle.tenant_id}', 'INC-2025-${randomInt(10000, 99999)}',
        '${vehicle.id}', ${driver ? `'${driver.id}'` : 'NULL'},
        '${daysAgo(randomInt(1, 365)).toISOString()}', '${type}', '${severity}',
        '${city.name}, FL', ${city.lat}, ${city.lng},
        '${type} incident - ${severity} severity',
        ${severity === 'severe' ? randomInt(1, 3) : 0},
        ${randomFloat(500, 15000)}, ${randomFloat(1000, 30000)},
        ${Math.random() < 0.4}, ${severity === 'severe'},
        '${randomItem(['open', 'investigating', 'resolved', 'closed'])}'
      )`);
    }

    await client.query(`
      INSERT INTO safety_incidents (
        tenant_id, incident_number, vehicle_id, driver_id, incident_date,
        incident_type, severity, location, latitude, longitude, description,
        injuries_count, property_damage_cost, vehicle_damage_cost,
        at_fault, reported_to_osha, status
      ) VALUES ${incidentValues.join(', ')}
    `);
    totalRecords += incidentValues.length;
    console.log(`   ✅ ${incidentValues.length} safety incidents`);

    // ========== VENDORS ==========
    console.log('🏪 Vendors...');
    const vendorValues: string[] = [];

    for (const tenant of tenants) {
      const count = randomInt(8, 15);

      for (let i = 0; i < count; i++) {
        const city = randomItem(floridaCities);
        const type = randomItem(['parts_supplier', 'fuel_provider', 'service_provider']);

        vendorValues.push(`(
          '${tenant.id}', '${city.name} ${type.replace('_', ' ')} Co.', '${type}',
          'Contact ${randomInt(1, 100)}', 'contact${i}@vendor.com',
          '${generatePhoneNumber()}', '${randomInt(100, 9999)} Industrial Pkwy',
          '${city.name}', 'FL', '${randomInt(30000, 34999)}', true
        )`);
      }
    }

    const vendorsResult = await client.query(`
      INSERT INTO vendors (
        tenant_id, vendor_name, vendor_type, contact_name, contact_email,
        contact_phone, address, city, state, zip_code, is_active
      ) VALUES ${vendorValues.join(', ')}
      RETURNING *
    `);
    totalRecords += vendorsResult.rows.length;
    console.log(`   ✅ ${vendorsResult.rows.length} vendors`);

    // ========== PURCHASE ORDERS ==========
    console.log('📝 Purchase Orders...');
    const poValues: string[] = [];

    for (const vendor of vendorsResult.rows) {
      const count = randomInt(3, 8);

      for (let i = 0; i < count; i++) {
        const status = randomItem(['draft', 'submitted', 'approved', 'ordered', 'received']);
        const subtotal = randomFloat(500, 10000);

        poValues.push(`(
          '${vendor.tenant_id}', 'PO-2025-${randomInt(10000, 99999)}',
          '${vendor.id}', '${daysAgo(randomInt(1, 180)).toISOString()}',
          '${status}', ${subtotal}, ${subtotal * 0.07}, ${randomFloat(50, 200)},
          '[{"part_number":"PART${randomInt(1000, 9999)}","description":"Parts","quantity":${randomInt(1, 10)},"unit_price":${randomFloat(50, 500)}}]'::jsonb
        )`);
      }
    }

    await client.query(`
      INSERT INTO purchase_orders (
        tenant_id, po_number, vendor_id, order_date, status,
        subtotal, tax, shipping, line_items
      ) VALUES ${poValues.join(', ')}
    `);
    totalRecords += poValues.length;
    console.log(`   ✅ ${poValues.length} purchase orders`);

    // ========== NOTIFICATIONS ==========
    console.log('🔔 Notifications...');
    const notifValues: string[] = [];
    const notifTemplates = [
      { type: 'alert', title: 'Maintenance Due', message: 'Vehicle maintenance due soon', priority: 'high' },
      { type: 'alert', title: 'Low Fuel', message: 'Low fuel alert', priority: 'normal' },
      { type: 'reminder', title: 'Route Starting', message: 'Route starts in 1 hour', priority: 'normal' },
      { type: 'info', title: 'Route Completed', message: 'Route completed', priority: 'low' }
    ];

    for (const user of users.filter(u => u.role !== 'viewer').slice(0, 100)) {
      const count = randomInt(15, 40);

      for (let i = 0; i < count; i++) {
        const template = randomItem(notifTemplates);
        const daysBack = randomInt(0, 90);
        const isRead = daysBack > 7 ? Math.random() < 0.7 : Math.random() < 0.3;

        notifValues.push(`(
          '${user.tenant_id}', '${user.id}', '${template.type}',
          '${template.title}', '${template.message}', '${template.priority}',
          ${isRead}, ${isRead ? `'${daysAgo(daysBack - randomInt(0, 3)).toISOString()}'` : 'NULL'},
          '${daysAgo(daysBack).toISOString()}'
        )`);
      }
    }

    await client.query(`
      INSERT INTO notifications (
        tenant_id, user_id, notification_type, title, message, priority,
        is_read, read_at, created_at
      ) VALUES ${notifValues.join(', ')}
    `);
    totalRecords += notifValues.length;
    console.log(`   ✅ ${notifValues.length} notifications`);

    // ========== AUDIT LOGS ==========
    console.log('📜 Audit Logs...');
    const auditValues: string[] = [];
    const actions = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN'];
    const resourceTypes = ['vehicles', 'work_orders', 'routes', 'drivers'];

    for (let i = 0; i < 1000; i++) {
      const user = randomItem(users.filter(u => u.is_active));

      auditValues.push(`(
        '${user.tenant_id}', '${user.id}', '${randomItem(actions)}',
        '${randomItem(resourceTypes)}', '${Math.random() < 0.98 ? 'success' : 'failure'}',
        '${daysAgo(randomInt(0, 90)).toISOString()}'
      )`);
    }

    await client.query(`
      INSERT INTO audit_logs (
        tenant_id, user_id, action, resource_type, outcome, created_at
      ) VALUES ${auditValues.join(', ')}
    `);
    totalRecords += auditValues.length;
    console.log(`   ✅ ${auditValues.length} audit logs`);

    await client.query('COMMIT');

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);

    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║  SUPPLEMENTAL SEED COMPLETE                       ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');
    console.log(`⏱️  Time: ${duration}s`);
    console.log(`📊 New Records: ${totalRecords.toLocaleString()}\n`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedSupplemental()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
