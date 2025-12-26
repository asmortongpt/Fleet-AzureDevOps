#!/usr/bin/env node
/**
 * COMPREHENSIVE SEED - Realistic Test Data
 */

import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config({ path: '../.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
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

const vehicleTemplates = [
  { make: 'Honda', model: 'Accord', type: 'Sedan', fuelType: 'Gasoline', weight: 'light' },
  { make: 'Toyota', model: 'Camry', type: 'Sedan', fuelType: 'Gasoline', weight: 'light' },
  { make: 'Tesla', model: 'Model 3', type: 'Sedan', fuelType: 'Electric', weight: 'light' },
  { make: 'Toyota', model: 'Prius', type: 'Sedan', fuelType: 'Hybrid', weight: 'light' },
  { make: 'Ford', model: 'Explorer', type: 'SUV', fuelType: 'Gasoline', weight: 'medium' },
  { make: 'Chevrolet', model: 'Tahoe', type: 'SUV', fuelType: 'Gasoline', weight: 'medium' },
  { make: 'Tesla', model: 'Model Y', type: 'SUV', fuelType: 'Electric', weight: 'medium' },
  { make: 'Toyota', model: 'Highlander Hybrid', type: 'SUV', fuelType: 'Hybrid', weight: 'medium' },
  { make: 'Ford', model: 'F-150', type: 'Pickup Truck', fuelType: 'Gasoline', weight: 'medium' },
  { make: 'Ford', model: 'F-250 Super Duty', type: 'Pickup Truck', fuelType: 'Diesel', weight: 'heavy' },
  { make: 'RAM', model: '1500', type: 'Pickup Truck', fuelType: 'Gasoline', weight: 'medium' },
  { make: 'Ford', model: 'Transit', type: 'Cargo Van', fuelType: 'Gasoline', weight: 'medium' },
  { make: 'Mercedes-Benz', model: 'Sprinter', type: 'Cargo Van', fuelType: 'Diesel', weight: 'medium' },
  { make: 'Freightliner', model: 'M2 106', type: 'Box Truck', fuelType: 'Diesel', weight: 'heavy' },
  { make: 'Freightliner', model: 'Cascadia', type: 'Semi-Truck', fuelType: 'Diesel', weight: 'heavy' },
  { make: 'Volvo', model: 'VNL', type: 'Semi-Truck', fuelType: 'Diesel', weight: 'heavy' }
];

const userRoles = ['admin', 'fleet_manager', 'driver', 'technician', 'viewer'];
const userStates = [true, true, true, true, false];
const driverStatuses = ['active', 'on_leave', 'suspended', 'terminated'];
const cdlClasses = ['A', 'B', 'C', null];
const cdlEndorsements = [['H'], ['N'], ['P'], ['T'], ['H', 'N'], []];

const maintenanceTypes = [
  'Oil Change', 'Tire Rotation', 'Brake Inspection', 'Battery Replacement',
  'Transmission Fluid Change', 'Coolant Flush', 'AC System Service', 'DOT Safety Inspection'
];

const workOrderPriorities = ['low', 'medium', 'high', 'critical'];
const workOrderStatuses = ['open', 'in_progress', 'on_hold', 'completed', 'cancelled'];
const workOrderTypes = ['preventive', 'corrective', 'inspection'];
const routeStatuses = ['planned', 'in_progress', 'completed', 'cancelled'];
const incidentTypes = ['accident', 'injury', 'near_miss', 'property_damage', 'citation'];
const incidentSeverities = ['minor', 'moderate', 'severe', 'fatal'];
const inspectionTypes = ['pre_trip', 'post_trip', 'safety', 'dot'];
const inspectionResults = ['pass', 'fail', 'needs_repair'];

function randomItem<T>(array: T[]): T { return array[Math.floor(Math.random() * array.length)]; }
function randomInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomFloat(min: number, max: number, decimals: number = 2): number { return parseFloat((Math.random() * (max - min) + min).toFixed(decimals)); }
function daysAgo(days: number): Date { const d = new Date(); d.setDate(d.getDate() - days); return d; }
function daysFromNow(days: number): Date { const d = new Date(); d.setDate(d.getDate() + days); return d; }
function monthsAgo(months: number): Date { const d = new Date(); d.setMonth(d.getMonth() - months); return d; }
function yearsAgo(years: number): Date { const d = new Date(); d.setFullYear(d.getFullYear() - years); return d; }
function generateVIN(): string {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let vin = '';
  for (let i = 0; i < 17; i++) vin += chars[Math.floor(Math.random() * chars.length)];
  return vin;
}
function generateLicensePlate(): string {
  return `FL${randomInt(100, 999)}ABC`;
}
function generatePhoneNumber(): string {
  return `${randomInt(200, 999)}-${randomInt(200, 999)}-${randomInt(1000, 9999)}`;
}
function generateWorkOrderNumber(): string {
  return `WO-${new Date().getFullYear()}-${randomInt(10000, 99999)}`;
}
function generateIncidentNumber(): string {
  return `INC-${new Date().getFullYear()}-${randomInt(10000, 99999)}`;
}
function maybeNull<T>(value: T, prob: number = 0.1): T | null {
  return Math.random() < prob ? null : value;
}

// MAIN SEED
async function seedDatabase() {
  const client = await pool.connect();
  try {
    console.log('STARTING EXTENSIVE SEED...');
    await client.query('BEGIN');

    const defaultPassword = await bcrypt.hash('TestPassword123!', 12);
    const counters = { tenants: 0, users: 0, vehicles: 0, drivers: 0, facilities: 0, fuelTransactions: 0, workOrders: 0, maintenanceSchedules: 0, routes: 0, geofences: 0, inspections: 0, safetyIncidents: 0, telemetryData: 0, notifications: 0, vendors: 0, purchaseOrders: 0, chargingStations: 0, chargingSessions: 0, auditLogs: 0 };

    // 1. TENANTS
    const tenantConfigs = [
      { name: 'Small Fleet Transport', domain: 'small-fleet.local', tier: 'basic', vehicleCount: 8, settings: { timezone: 'America/New_York', features: ['basic_tracking', 'maintenance'] } },
      { name: 'Medium Logistics Company', domain: 'medium-logistics.local', tier: 'professional', vehicleCount: 35, settings: { timezone: 'America/New_York', features: ['advanced_tracking', 'maintenance', 'fuel_management', 'routing'] } },
      { name: 'Enterprise Fleet Services', domain: 'enterprise-fleet.local', tier: 'enterprise', vehicleCount: 120, settings: { timezone: 'America/New_York', features: ['all'] } },
      { name: 'Demo Account - Showcase', domain: 'demo-showcase.local', tier: 'demo', vehicleCount: 25, settings: { timezone: 'America/New_York', features: ['all'], demo_mode: true } },
      { name: 'Test Tenant (Inactive)', domain: 'test-inactive.local', tier: 'test', vehicleCount: 5, settings: { timezone: 'America/New_York' } }
    ];

    const tenants: any[] = [];
    for (const config of tenantConfigs) {
      const res = await client.query(
        `INSERT INTO tenants (name, domain, settings, is_active) VALUES ($1, $2, $3, $4) ON CONFLICT (domain) DO UPDATE SET name = EXCLUDED.name RETURNING *`,
        [config.name, config.domain, JSON.stringify(config.settings), config.tier !== 'test']
      );
      tenants.push({ ...res.rows[0], ...config });
      counters.tenants++;
    }
    console.log('Tenants created');

    // 2. USERS
    const users: any[] = [];
    for (const tenant of tenants) {
      // Admin
      const admin = await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active, failed_login_attempts, mfa_enabled) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name RETURNING *`,
        [tenant.id, `admin@${tenant.domain}`, defaultPassword, 'Admin', 'User', generatePhoneNumber(), 'admin', true, 0, true]
      );
      users.push(admin.rows[0]); counters.users++;

      // Managers
      const fmCount = tenant.tier === 'enterprise' ? 5 : 2;
      for (let i = 1; i <= fmCount; i++) {
        const isActive = true;
        const fm = await client.query(
          `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name RETURNING *`,
          [tenant.id, `manager${i}@${tenant.domain}`, defaultPassword, 'Fleet', `Manager ${i}`, generatePhoneNumber(), 'fleet_manager', isActive]
        );
        users.push(fm.rows[0]); counters.users++;
      }

      // Drivers
      const driverCount = Math.ceil(tenant.vehicleCount * 0.7);
      for (let i = 1; i <= driverCount; i++) {
        const isActive = Math.random() < 0.9;
        const driver = await client.query(
          `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name RETURNING *`,
          [tenant.id, `driver${i}@${tenant.domain}`, defaultPassword, 'Driver', `${i}`, generatePhoneNumber(), 'driver', isActive]
        );
        users.push(driver.rows[0]); counters.users++;
      }

      // Technicians
      const techCount = tenant.tier === 'enterprise' ? 5 : 2;
      for (let i = 1; i <= techCount; i++) {
        const tech = await client.query(
          `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name RETURNING *`,
          [tenant.id, `tech${i}@${tenant.domain}`, defaultPassword, 'Tech', `${i}`, generatePhoneNumber(), 'technician', true]
        );
        users.push(tech.rows[0]); counters.users++;
      }
    }
    console.log('Users created');

    // 3. DRIVERS
    const drivers: any[] = [];
    const driverUsers = users.filter((u: any) => u.role === 'driver');
    for (const du of driverUsers) {
      const status = randomItem(driverStatuses);
      const cdl = randomItem(cdlClasses);
      const drv = await client.query(
        `INSERT INTO drivers (tenant_id, user_id, license_number, license_state, license_expiration, cdl_class, status, emergency_contact_name, emergency_contact_phone) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [du.tenant_id, du.id, `FL${randomInt(1000, 9999)}`, 'FL', daysFromNow(randomInt(30, 700)), cdl, status, 'Emerg Contact', generatePhoneNumber()]
      );
      drivers.push(drv.rows[0]); counters.drivers++;
    }
    console.log('Driver profiles created');

    // 4. FACILITIES
    const facilities: any[] = [];
    for (const tenant of tenants) {
      const count = tenant.tier === 'enterprise' ? 5 : 2;
      for (let i = 0; i < count; i++) {
        const city = randomItem(floridaCities);
        const type: any = randomItem(['garage', 'depot', 'service_center']);
        const fac = await client.query(
          `INSERT INTO facilities (tenant_id, name, facility_type, address, city, state, zip_code, latitude, longitude, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
          [tenant.id, `${city.name} ${type}`, type, `123 ${city.name} Blvd`, city.name, 'FL', '33000', city.lat, city.lng, true]
        );
        facilities.push(fac.rows[0]); counters.facilities++;
      }
    }
    console.log('Facilities created');

    // 5. VEHICLES
    const vehicles: any[] = [];
    for (const tenant of tenants) {
      const tDrivers = drivers.filter(d => d.tenant_id === tenant.id);
      for (let i = 0; i < tenant.vehicleCount; i++) {
        const tmpl = randomItem(vehicleTemplates);
        const year = randomInt(2018, 2024);
        const status = Math.random() < 0.8 ? 'active' : 'maintenance';
        const driverId = (status === 'active' && tDrivers.length > 0) ? randomItem(tDrivers).user_id : null;

        const veh = await client.query(
          `INSERT INTO vehicles (tenant_id, vin, make, model, year, license_plate, vehicle_type, fuel_type, status, odometer, assigned_driver_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
          [tenant.id, generateVIN(), tmpl.make, tmpl.model, year, generateLicensePlate(), tmpl.type, tmpl.fuelType, status, randomInt(5000, 100000), driverId]
        );
        vehicles.push(veh.rows[0]); counters.vehicles++;
      }
    }
    console.log('Vehicles created');

    // 6. FUEL TRANSACTIONS
    for (const v of vehicles) {
      if (v.fuel_type === 'Electric') continue;
      const count = randomInt(5, 15);
      for (let i = 0; i < count; i++) {
        await client.query(
          `INSERT INTO fuel_transactions (tenant_id, vehicle_id, transaction_date, gallons, price_per_gallon, fuel_type, location, odometer_reading) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [v.tenant_id, v.id, daysAgo(randomInt(1, 365)), randomFloat(10, 30), randomFloat(3, 4), v.fuel_type, 'Station', v.odometer - randomInt(100, 2000)]
        );
        counters.fuelTransactions++;
      }
    }

    // 7. CHARGING
    for (const tenant of tenants) {
      // Create stations
      const sRes = await client.query(`INSERT INTO charging_stations (tenant_id, station_name, station_type, location, latitude, longitude, is_operational) VALUES ($1,$2,'level_2','123 Main', 0, 0, true) RETURNING *`, [tenant.id, 'Station 1']);
      counters.chargingStations++;
      const station = sRes.rows[0];
      // Sessions
      const evs = vehicles.filter((v: any) => v.tenant_id === tenant.id && v.fuel_type === 'Electric');
      for (const ev of evs) {
        await client.query(`INSERT INTO charging_sessions (tenant_id, vehicle_id, charging_station_id, start_time, end_time, energy_delivered_kwh, cost, status) VALUES ($1,$2,$3,NOW(),NOW(), 20, 5, 'completed')`, [tenant.id, ev.id, station.id]);
        counters.chargingSessions++;
      }
    }

    // 8. WORK ORDERS
    for (const v of vehicles) {
      if (Math.random() < 0.3) {
        await client.query(
          `INSERT INTO work_orders (tenant_id, work_order_number, vehicle_id, status, description, priority, type) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [v.tenant_id, generateWorkOrderNumber(), v.id, 'open', 'Fix stuff', 'medium', 'corrective']
        );
        counters.workOrders++;
      }
    }

    // 9. MAINTENANCE SCHEDULES
    for (const v of vehicles) {
      await client.query(
        `INSERT INTO maintenance_schedules (tenant_id, vehicle_id, service_type, interval_type, interval_value, is_active) VALUES ($1,$2,'Oil Change','miles',5000,true)`,
        [v.tenant_id, v.id]
      );
      counters.maintenanceSchedules++;
    }

    // 10. ROUTES
    const activeVs = vehicles.filter((v: any) => v.status === 'active' && v.assigned_driver_id);
    for (const v of activeVs) {
      await client.query(
        `INSERT INTO routes (tenant_id, route_name, vehicle_id, driver_id, status, start_location, end_location, planned_start_time, planned_end_time) VALUES ($1,$2,$3,$4,'planned','A','B',NOW(),NOW())`,
        [v.tenant_id, 'Route 1', v.id, v.assigned_driver_id]
      );
      counters.routes++;
    }

    // 11. GEOFENCES
    for (const t of tenants) {
      await client.query(`INSERT INTO geofences (tenant_id, name, geofence_type, center_latitude, center_longitude, radius) VALUES ($1,'Geo 1','circular',25.0,-80.0,500)`, [t.id]);
      counters.geofences++;
    }

    // 12. INSPECTIONS
    for (const v of vehicles) {
      await client.query(`INSERT INTO inspections (tenant_id, vehicle_id, driver_id, inspection_date, inspection_type, status, form_data) VALUES ($1,$2,$3,NOW(),'pre_trip','pass','{}'::jsonb)`, [v.tenant_id, v.id, v.assigned_driver_id]);
      counters.inspections++;
    }

    // 13. INCIDENTS
    for (const v of vehicles) {
      if (Math.random() < 0.1) {
        await client.query(`INSERT INTO safety_incidents (tenant_id, incident_number, vehicle_id, incident_date, incident_type, severity, description, status) VALUES ($1,$2,$3,NOW(),'accident','minor','Desc','open')`, [v.tenant_id, generateIncidentNumber(), v.id]);
        counters.safetyIncidents++;
      }
    }

    // 14. TELEMETRY
    for (const v of vehicles) {
      if (v.status === 'active') {
        await client.query(`INSERT INTO telemetry_data (tenant_id, vehicle_id, timestamp, latitude, longitude, speed) VALUES ($1,$2,NOW(),25.0,-80.0,60)`, [v.tenant_id, v.id]);
        counters.telemetryData++;
      }
    }

    // 15. VENDORS & POs
    for (const t of tenants) {
      const vend = await client.query(`INSERT INTO vendors (tenant_id, vendor_name, vendor_type, is_active) VALUES ($1,'Vendor A','parts_supplier',true) RETURNING *`, [t.id]);
      counters.vendors++;
      await client.query(`INSERT INTO purchase_orders (tenant_id, po_number, vendor_id, status, subtotal, tax, shipping, line_items) VALUES ($1, 'PO-123', $2, 'draft', 100, 7, 10, '[]'::jsonb)`, [t.id, vend.rows[0].id]);
      counters.purchaseOrders++;
    }

    // 16. NOTIFICATIONS
    for (const u of users) {
      await client.query(`INSERT INTO notifications (tenant_id, user_id, notification_type, title, message, priority, is_read) VALUES ($1,$2,'info','Hello','World','normal',false)`, [u.tenant_id, u.id]);
      counters.notifications++;
    }

    // 17. AUDIT LOGS
    for (let i = 0; i < 100; i++) {
      const u = randomItem(users);
      await client.query(`INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, outcome) VALUES ($1,$2,'LOGIN','auth','success')`, [u.tenant_id, u.id]);
      counters.auditLogs++;
    }

    await client.query('COMMIT');
    console.log('Seed Complete:', counters);

  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    throw e;
  } finally {
    client.release();
    pool.end();
  }
}

seedDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
