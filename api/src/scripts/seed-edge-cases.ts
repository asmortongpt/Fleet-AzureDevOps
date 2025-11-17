/**
 * COMPREHENSIVE EDGE CASE TEST DATA SEEDER
 *
 * This script seeds the database with test data covering:
 * - ALL possible enum/status values
 * - ALL edge cases and boundary conditions
 * - ALL workflow states
 * - NULL values for nullable fields
 * - Extreme values (min/max)
 * - Special scenarios
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '15432'),
  user: process.env.DB_USER || 'fleetadmin',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fleetdb',
});

// Get tenant ID
async function getTenantId(): Promise<string> {
  const result = await pool.query('SELECT id FROM tenants LIMIT 1');
  return result.rows[0]?.id || uuidv4();
}

// Get a user ID for each role
async function getUserIds() {
  const result = await pool.query(`
    SELECT id, role FROM users ORDER BY role
  `);

  const users: Record<string, string> = {};
  for (const row of result.rows) {
    if (!users[row.role]) {
      users[row.role] = row.id;
    }
  }

  return users;
}

// Seed missing vehicle statuses and types
async function seedVehicleEdgeCases(tenantId: string) {
  console.log('Seeding vehicle edge cases...');

  const vehicles = [
    // Missing statuses
    { status: 'inactive', type: 'Sedan', fuel: 'Gasoline', notes: 'Inactive vehicle for testing' },
    { status: 'decommissioned', type: 'SUV', fuel: 'Hybrid', notes: 'Decommissioned vehicle' },
    { status: 'reserved', type: 'Pickup Truck', fuel: 'Diesel', notes: 'Reserved for special use' },

    // Missing vehicle types
    { status: 'active', type: 'Van', fuel: 'Gasoline', notes: 'Standard van' },
    { status: 'active', type: 'Flatbed', fuel: 'Diesel', notes: 'Flatbed truck' },
    { status: 'active', type: 'Refrigerated Truck', fuel: 'Diesel', notes: 'Refrigerated transport' },
    { status: 'active', type: 'Dump Truck', fuel: 'Diesel', notes: 'Heavy duty dump truck' },
    { status: 'active', type: 'Tow Truck', fuel: 'Diesel', notes: 'Emergency tow vehicle' },

    // Missing fuel types
    { status: 'active', type: 'Sedan', fuel: 'Hybrid', notes: 'Hybrid vehicle' },
    { status: 'active', type: 'Van', fuel: 'Propane', notes: 'Propane-powered van' },
    { status: 'active', type: 'Pickup Truck', fuel: 'CNG', notes: 'CNG vehicle' },
    { status: 'active', type: 'Sedan', fuel: 'Hydrogen', notes: 'Hydrogen fuel cell vehicle' },

    // Boundary cases
    { status: 'active', type: 'Sedan', fuel: 'Electric', notes: 'Zero miles', mileage: 0, battery: 0 },
    { status: 'active', type: 'Semi-Truck', fuel: 'Diesel', notes: 'Very high mileage', mileage: 1500000 },

    // Edge cases
    { status: 'active', type: 'Sedan', fuel: 'Gasoline', notes: 'Expired registration', regExpired: true },
    { status: 'active', type: 'Pickup Truck', fuel: 'Diesel', notes: 'NULL VIN', vin: null },
    { status: 'active', type: 'Cargo Van', fuel: 'Electric', notes: 'NULL license plate', licensePlate: null },
  ];

  for (const v of vehicles) {
    const vehicleId = uuidv4();
    const year = 2020 + Math.floor(Math.random() * 5);
    const make = ['Ford', 'Chevrolet', 'Toyota', 'RAM', 'Freightliner'][Math.floor(Math.random() * 5)];
    const model = v.type;
    const vin = v.vin === null ? null : `TEST${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
    const licensePlate = v.licensePlate === null ? null : `TST${Math.floor(Math.random() * 9999)}`;
    const mileage = v.mileage !== undefined ? v.mileage : Math.floor(Math.random() * 100000);
    const batteryLevel = v.battery !== undefined ? v.battery : (v.fuel === 'Electric' ? Math.floor(Math.random() * 100) : null);
    const regExpiry = v.regExpired ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    await pool.query(`
      INSERT INTO vehicles (
        id, tenant_id, vehicle_name, vehicle_type, make, model, year,
        vin, license_plate, status, fuel_type, current_mileage,
        battery_level, registration_expiry, notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
      ON CONFLICT (id) DO NOTHING
    `, [
      vehicleId, tenantId, `${v.type} - ${v.notes}`, v.type, make, model, year,
      vin, licensePlate, v.status, v.fuel, mileage,
      batteryLevel, regExpiry, v.notes
    ]);
  }

  console.log(`  ✓ Seeded ${vehicles.length} vehicle edge cases`);
}

// Seed missing driver statuses and license classes
async function seedDriverEdgeCases(tenantId: string) {
  console.log('Seeding driver edge cases...');

  const drivers = [
    // Missing statuses
    { status: 'on_leave', license: 'Class A', notes: 'Driver on medical leave' },
    { status: 'suspended', license: 'CDL-A', notes: 'Suspended license' },
    { status: 'terminated', license: 'Class C', notes: 'Former employee' },

    // Missing license classes
    { status: 'active', license: 'Class D', notes: 'Class D license holder' },
    { status: 'active', license: 'Class M', notes: 'Motorcycle license' },
    { status: 'active', license: 'CDL-B', notes: 'CDL B license holder' },
    { status: 'active', license: 'CDL-C', notes: 'CDL C license holder' },

    // Edge cases
    { status: 'active', license: 'Class A', notes: 'Expired license', licenseExpired: true },
    { status: 'active', license: 'CDL-A', notes: 'No certifications', noCerts: true },
    { status: 'inactive', license: 'Class C', notes: 'No assigned vehicle', noVehicle: true },
  ];

  for (const d of drivers) {
    const driverId = uuidv4();
    const firstName = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emily'][Math.floor(Math.random() * 6)];
    const lastName = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'][Math.floor(Math.random() * 6)];
    const licenseNumber = `DL${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const licenseExpiry = d.licenseExpired
      ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const certifications = d.noCerts ? '[]' : JSON.stringify(['HazMat', 'Tanker']);

    await pool.query(`
      INSERT INTO drivers (
        id, tenant_id, first_name, last_name, license_number, license_class,
        license_expiry, status, certifications, notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, NOW())
      ON CONFLICT (id) DO NOTHING
    `, [
      driverId, tenantId, firstName, lastName, licenseNumber, d.license,
      licenseExpiry, d.status, certifications, d.notes
    ]);
  }

  console.log(`  ✓ Seeded ${drivers.length} driver edge cases`);
}

// Seed missing work order statuses, priorities, and types
async function seedWorkOrderEdgeCases(tenantId: string) {
  console.log('Seeding work order edge cases...');

  // Get a vehicle
  const vehicleResult = await pool.query('SELECT id FROM vehicles LIMIT 1');
  const vehicleId = vehicleResult.rows[0]?.id;
  if (!vehicleId) return;

  const workOrders = [
    // Missing statuses
    { status: 'assigned', priority: 'medium', type: 'preventive', cost: 500, notes: 'Assigned to technician' },
    { status: 'on_hold', priority: 'low', type: 'corrective', cost: 200, notes: 'Waiting for parts' },
    { status: 'cancelled', priority: 'high', type: 'inspection', cost: 0, notes: 'Cancelled by customer' },
    { status: 'closed', priority: 'medium', type: 'preventive', cost: 750, notes: 'Closed after completion' },

    // Missing priorities
    { status: 'open', priority: 'urgent', type: 'emergency', cost: 5000, notes: 'Urgent repair needed' },

    // Missing types
    { status: 'completed', priority: 'low', type: 'modification', cost: 1200, notes: 'Vehicle modification' },
    { status: 'open', priority: 'high', type: 'recall', cost: 0, notes: 'Manufacturer recall' },
    { status: 'completed', priority: 'medium', type: 'warranty', cost: 0, notes: 'Warranty repair' },

    // Boundary cases
    { status: 'completed', priority: 'low', type: 'preventive', cost: 0, notes: '$0 cost work order' },
    { status: 'in_progress', priority: 'critical', type: 'emergency', cost: 125000, notes: 'Very expensive repair' },

    // Time edge cases
    { status: 'open', priority: 'high', type: 'corrective', cost: 500, notes: 'Open >365 days', ancient: true },
    { status: 'completed', priority: 'critical', type: 'emergency', cost: 2000, notes: 'Completed same day', sameDay: true },
  ];

  for (const wo of workOrders) {
    const woId = uuidv4();
    const createdAt = wo.ancient
      ? new Date(Date.now() - 400 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const completedAt = wo.status === 'completed'
      ? (wo.sameDay ? createdAt : new Date(createdAt.getTime() + Math.random() * 10 * 24 * 60 * 60 * 1000))
      : null;

    await pool.query(`
      INSERT INTO work_orders (
        id, tenant_id, vehicle_id, title, description, status, priority,
        work_order_type, total_cost, notes, created_at, completed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO NOTHING
    `, [
      woId, tenantId, vehicleId, `${wo.type.toUpperCase()}: ${wo.notes}`,
      wo.notes, wo.status, wo.priority, wo.type, wo.cost, wo.notes,
      createdAt, completedAt
    ]);
  }

  console.log(`  ✓ Seeded ${workOrders.length} work order edge cases`);
}

// Seed missing route statuses
async function seedRouteEdgeCases(tenantId: string) {
  console.log('Seeding route edge cases...');

  const vehicleResult = await pool.query('SELECT id FROM vehicles LIMIT 1');
  const driverResult = await pool.query('SELECT id FROM drivers LIMIT 1');
  const vehicleId = vehicleResult.rows[0]?.id;
  const driverId = driverResult.rows[0]?.id;
  if (!vehicleId || !driverId) return;

  const routes = [
    // Missing statuses
    { status: 'scheduled', distance: 50, notes: 'Scheduled for future' },
    { status: 'delayed', distance: 100, notes: 'Route delayed due to traffic' },
    { status: 'failed', distance: 75, notes: 'Route failed - vehicle breakdown' },

    // Boundary cases
    { status: 'completed', distance: 0, notes: 'Zero mile route' },
    { status: 'in_progress', distance: 1500, notes: 'Very long route', multiDay: true },
  ];

  for (const r of routes) {
    const routeId = uuidv4();
    const startTime = r.status === 'scheduled'
      ? new Date(Date.now() + 24 * 60 * 60 * 1000)
      : new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000);
    const endTime = ['completed', 'failed'].includes(r.status)
      ? new Date(startTime.getTime() + (r.multiDay ? 48 : 8) * 60 * 60 * 1000)
      : null;

    await pool.query(`
      INSERT INTO routes (
        id, tenant_id, vehicle_id, driver_id, route_name, status,
        start_location, end_location, start_time, end_time,
        distance_miles, notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      ON CONFLICT (id) DO NOTHING
    `, [
      routeId, tenantId, vehicleId, driverId, `Route - ${r.notes}`, r.status,
      'Warehouse A', 'Customer Site B', startTime, endTime,
      r.distance, r.notes
    ]);
  }

  console.log(`  ✓ Seeded ${routes.length} route edge cases`);
}

// Seed missing inspection types and statuses
async function seedInspectionEdgeCases(tenantId: string) {
  console.log('Seeding inspection edge cases...');

  const vehicleResult = await pool.query('SELECT id FROM vehicles LIMIT 1');
  const driverResult = await pool.query('SELECT id FROM drivers LIMIT 1');
  const vehicleId = vehicleResult.rows[0]?.id;
  const inspectorId = driverResult.rows[0]?.id;
  if (!vehicleId || !inspectorId) return;

  const inspections = [
    // All inspection types
    { type: 'pre_trip', status: 'completed', result: 'passed' },
    { type: 'post_trip', status: 'completed', result: 'passed' },
    { type: 'annual', status: 'completed', result: 'passed' },
    { type: 'dot', status: 'completed', result: 'passed' },
    { type: 'state', status: 'completed', result: 'passed' },
    { type: 'safety', status: 'completed', result: 'failed' },
    { type: 'emissions', status: 'completed', result: 'passed' },
    { type: 'brake', status: 'completed', result: 'needs_repair' },
    { type: 'comprehensive', status: 'completed', result: 'passed' },

    // All statuses
    { type: 'annual', status: 'pending', result: null },
    { type: 'dot', status: 'in_progress', result: null },
    { type: 'safety', status: 'failed', result: 'failed' },
  ];

  for (const insp of inspections) {
    const inspId = uuidv4();
    const inspectionDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);

    await pool.query(`
      INSERT INTO inspections (
        id, tenant_id, vehicle_id, inspector_id, inspection_type,
        inspection_date, status, notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (id) DO NOTHING
    `, [
      inspId, tenantId, vehicleId, inspectorId, insp.type,
      inspectionDate, insp.status, `${insp.type} inspection - ${insp.status}`
    ]);
  }

  console.log(`  ✓ Seeded ${inspections.length} inspection edge cases`);
}

// Seed missing safety incident types and severities
async function seedSafetyIncidentEdgeCases(tenantId: string) {
  console.log('Seeding safety incident edge cases...');

  const vehicleResult = await pool.query('SELECT id FROM vehicles LIMIT 1');
  const driverResult = await pool.query('SELECT id FROM drivers LIMIT 1');
  const vehicleId = vehicleResult.rows[0]?.id;
  const driverId = driverResult.rows[0]?.id;
  if (!vehicleId || !driverId) return;

  const incidents = [
    // All incident types with various severities
    { type: 'accident', severity: 'severe', status: 'resolved' },
    { type: 'injury', severity: 'moderate', status: 'under_review' },
    { type: 'near_miss', severity: 'minor', status: 'closed' },
    { type: 'property_damage', severity: 'moderate', status: 'resolved' },
    { type: 'citation', severity: 'minor', status: 'closed' },
    { type: 'violation', severity: 'major', status: 'investigating' },
    { type: 'equipment_failure', severity: 'critical', status: 'resolved' },
    { type: 'environmental', severity: 'severe', status: 'under_review' },
    { type: 'theft', severity: 'major', status: 'investigating' },
    { type: 'vandalism', severity: 'moderate', status: 'resolved' },

    // Fatal severity
    { type: 'accident', severity: 'fatal', status: 'investigating' },
  ];

  for (const inc of incidents) {
    const incId = uuidv4();
    const incidentDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000);

    await pool.query(`
      INSERT INTO safety_incidents (
        id, tenant_id, vehicle_id, driver_id, incident_type, severity,
        incident_date, description, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (id) DO NOTHING
    `, [
      incId, tenantId, vehicleId, driverId, inc.type, inc.severity,
      incidentDate, `${inc.type} incident with ${inc.severity} severity`,
      inc.status
    ]);
  }

  console.log(`  ✓ Seeded ${incidents.length} safety incident edge cases`);
}

// Seed missing user roles and statuses
async function seedUserEdgeCases(tenantId: string) {
  console.log('Seeding user edge cases...');

  const users = [
    // Missing roles
    { role: 'dispatcher', status: 'active', email: 'dispatcher@test.com' },
    { role: 'viewer', status: 'active', email: 'viewer@test.com' },
    { role: 'accountant', status: 'active', email: 'accountant@test.com' },
    { role: 'safety_manager', status: 'active', email: 'safety@test.com' },

    // Missing statuses
    { role: 'driver', status: 'suspended', email: 'suspended@test.com' },
    { role: 'technician', status: 'pending', email: 'pending@test.com' },
  ];

  for (const u of users) {
    const userId = uuidv4();
    const name = u.role.charAt(0).toUpperCase() + u.role.slice(1);

    await pool.query(`
      INSERT INTO users (
        id, tenant_id, email, password_hash, name, role, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (email) DO NOTHING
    `, [
      userId, tenantId, u.email, '$2b$10$dummy.hash.for.testing.purposes',
      name, u.role, u.status
    ]);
  }

  console.log(`  ✓ Seeded ${users.length} user edge cases`);
}

// Seed missing notification types, priorities, and statuses
async function seedNotificationEdgeCases(tenantId: string) {
  console.log('Seeding notification edge cases...');

  const userResult = await pool.query('SELECT id FROM users LIMIT 1');
  const userId = userResult.rows[0]?.id;
  if (!userId) return;

  const notifications = [
    // All types and priorities
    { type: 'warning', priority: 'urgent', status: 'unread' },
    { type: 'critical', priority: 'critical', status: 'unread' },
    { type: 'system', priority: 'normal', status: 'read' },
    { type: 'maintenance', priority: 'high', status: 'acknowledged' },
    { type: 'safety', priority: 'critical', status: 'unread' },
    { type: 'compliance', priority: 'high', status: 'read' },

    // All statuses
    { type: 'info', priority: 'low', status: 'dismissed' },
    { type: 'reminder', priority: 'normal', status: 'archived' },
  ];

  for (const n of notifications) {
    const notifId = uuidv4();

    await pool.query(`
      INSERT INTO notifications (
        id, tenant_id, user_id, notification_type, priority, status,
        title, message, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (id) DO NOTHING
    `, [
      notifId, tenantId, userId, n.type, n.priority, n.status,
      `${n.type.toUpperCase()} Notification`,
      `This is a ${n.type} notification with ${n.priority} priority`
    ]);
  }

  console.log(`  ✓ Seeded ${notifications.length} notification edge cases`);
}

// Seed fuel transaction edge cases
async function seedFuelEdgeCases(tenantId: string) {
  console.log('Seeding fuel transaction edge cases...');

  const vehicleResult = await pool.query('SELECT id FROM vehicles WHERE fuel_type != \'Electric\' LIMIT 1');
  const vehicleId = vehicleResult.rows[0]?.id;
  if (!vehicleId) return;

  const transactions = [
    // Missing fuel type
    { fuelType: 'DEF', gallons: 10, cost: 0, pricePerGallon: 0, notes: '$0 test transaction' },

    // Boundary cases
    { fuelType: 'Diesel', gallons: 500, cost: 7500, pricePerGallon: 15, notes: 'Bulk purchase >$5000' },
    { fuelType: 'Gasoline', gallons: 50, cost: 500, pricePerGallon: 10, notes: 'Price outlier $10/gallon' },
  ];

  for (const ft of transactions) {
    const ftId = uuidv4();
    const transactionDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);

    await pool.query(`
      INSERT INTO fuel_transactions (
        id, tenant_id, vehicle_id, transaction_date, fuel_type,
        gallons, cost, price_per_gallon, notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (id) DO NOTHING
    `, [
      ftId, tenantId, vehicleId, transactionDate, ft.fuelType,
      ft.gallons, ft.cost, ft.pricePerGallon, ft.notes
    ]);
  }

  console.log(`  ✓ Seeded ${transactions.length} fuel transaction edge cases`);
}

// Seed charging session edge cases
async function seedChargingEdgeCases(tenantId: string) {
  console.log('Seeding charging session edge cases...');

  const vehicleResult = await pool.query('SELECT id FROM vehicles WHERE fuel_type = \'Electric\' LIMIT 1');
  const stationResult = await pool.query('SELECT id FROM charging_stations LIMIT 1');
  const vehicleId = vehicleResult.rows[0]?.id;
  const stationId = stationResult.rows[0]?.id;

  if (!vehicleId || !stationId) {
    console.log('  ⚠ Skipped - no electric vehicle or charging station');
    return;
  }

  const sessions = [
    // All statuses
    { status: 'pending', energy: 0, startBattery: 20, endBattery: 20 },
    { status: 'charging', energy: 25, startBattery: 30, endBattery: 60 },
    { status: 'interrupted', energy: 10, startBattery: 40, endBattery: 50 },
    { status: 'failed', energy: 0, startBattery: 25, endBattery: 25 },
    { status: 'cancelled', energy: 0, startBattery: 35, endBattery: 35 },
  ];

  for (const s of sessions) {
    const sessionId = uuidv4();
    const startTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const endTime = ['completed', 'interrupted', 'failed'].includes(s.status)
      ? new Date(startTime.getTime() + Math.random() * 4 * 60 * 60 * 1000)
      : null;

    await pool.query(`
      INSERT INTO charging_sessions (
        id, tenant_id, vehicle_id, charging_station_id, start_time,
        end_time, energy_delivered_kwh, start_battery_level, end_battery_level,
        status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      ON CONFLICT (id) DO NOTHING
    `, [
      sessionId, tenantId, vehicleId, stationId, startTime,
      endTime, s.energy, s.startBattery, s.endBattery, s.status
    ]);
  }

  console.log(`  ✓ Seeded ${sessions.length} charging session edge cases`);
}

// Seed maintenance schedule edge cases
async function seedMaintenanceEdgeCases(tenantId: string) {
  console.log('Seeding maintenance schedule edge cases...');

  const vehicleResult = await pool.query('SELECT id FROM vehicles LIMIT 1');
  const vehicleId = vehicleResult.rows[0]?.id;
  if (!vehicleId) return;

  const schedules = [
    // All recurrence types
    { type: 'mileage', status: 'scheduled', priority: 'medium' },
    { type: 'time', status: 'due', priority: 'high' },
    { type: 'engine_hours', status: 'scheduled', priority: 'low' },
    { type: 'combined', status: 'due', priority: 'medium' },
    { type: 'one_time', status: 'completed', priority: 'low' },

    // All statuses
    { type: 'time', status: 'overdue', priority: 'urgent', overdue: 30 },
    { type: 'mileage', status: 'skipped', priority: 'low' },
    { type: 'time', status: 'cancelled', priority: 'medium' },

    // Edge cases
    { type: 'time', status: 'overdue', priority: 'critical', overdue: 400 }, // >365 days overdue
  ];

  for (const ms of schedules) {
    const schedId = uuidv4();
    const nextDueDate = ms.overdue
      ? new Date(Date.now() - ms.overdue * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000);

    await pool.query(`
      INSERT INTO maintenance_schedules (
        id, tenant_id, vehicle_id, maintenance_type, recurrence_type,
        interval_value, interval_unit, next_due_date, status, priority,
        description, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      ON CONFLICT (id) DO NOTHING
    `, [
      schedId, tenantId, vehicleId, 'Oil Change', ms.type,
      5000, 'miles', nextDueDate, ms.status, ms.priority,
      `${ms.type} maintenance - ${ms.status}`
    ]);
  }

  console.log(`  ✓ Seeded ${schedules.length} maintenance schedule edge cases`);
}

// Seed policy edge cases
async function seedPolicyEdgeCases(tenantId: string) {
  console.log('Seeding policy edge cases...');

  const policies = [
    // All policy types
    { type: 'safety', status: 'active' },
    { type: 'maintenance', status: 'active' },
    { type: 'fuel', status: 'active' },
    { type: 'driver_conduct', status: 'active' },
    { type: 'vehicle_use', status: 'active' },
    { type: 'compliance', status: 'active' },
    { type: 'environmental', status: 'active' },
    { type: 'security', status: 'active' },

    // All statuses
    { type: 'safety', status: 'draft' },
    { type: 'maintenance', status: 'pending_review' },
    { type: 'fuel', status: 'inactive' },
    { type: 'compliance', status: 'archived' },
    { type: 'safety', status: 'superseded' },
  ];

  for (const p of policies) {
    const policyId = uuidv4();

    await pool.query(`
      INSERT INTO policies (
        id, tenant_id, policy_name, policy_type, status, version,
        content, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (id) DO NOTHING
    `, [
      policyId, tenantId, `${p.type.toUpperCase()} Policy`, p.type,
      p.status, '1.0', `This is a ${p.type} policy in ${p.status} status`
    ]);
  }

  console.log(`  ✓ Seeded ${policies.length} policy edge cases`);
}

// Seed deployment edge cases
async function seedDeploymentEdgeCases(tenantId: string) {
  console.log('Seeding deployment edge cases...');

  const deployments = [
    // All environments and statuses
    { env: 'development', status: 'deployed' },
    { env: 'staging', status: 'deployed' },
    { env: 'production', status: 'deployed' },
    { env: 'testing', status: 'pending' },
    { env: 'qa', status: 'deploying' },
    { env: 'production', status: 'failed' },
    { env: 'staging', status: 'rolled_back' },
  ];

  for (const d of deployments) {
    const deployId = uuidv4();
    const deployedAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);

    await pool.query(`
      INSERT INTO deployments (
        id, tenant_id, environment, version, commit_hash, branch,
        status, deployed_by, deployed_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (id) DO NOTHING
    `, [
      deployId, tenantId, d.env, '1.0.0', 'abc123def456', 'main',
      d.status, 'system', deployedAt
    ]);
  }

  console.log(`  ✓ Seeded ${deployments.length} deployment edge cases`);
}

// Main execution
async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║       SEEDING COMPREHENSIVE EDGE CASE TEST DATA                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    const tenantId = await getTenantId();
    console.log(`Using tenant ID: ${tenantId}\n`);

    await seedVehicleEdgeCases(tenantId);
    await seedDriverEdgeCases(tenantId);
    await seedWorkOrderEdgeCases(tenantId);
    await seedRouteEdgeCases(tenantId);
    await seedInspectionEdgeCases(tenantId);
    await seedSafetyIncidentEdgeCases(tenantId);
    await seedUserEdgeCases(tenantId);
    await seedNotificationEdgeCases(tenantId);
    await seedFuelEdgeCases(tenantId);
    await seedChargingEdgeCases(tenantId);
    await seedMaintenanceEdgeCases(tenantId);
    await seedPolicyEdgeCases(tenantId);
    await seedDeploymentEdgeCases(tenantId);

    console.log('\n✓✓✓ All edge case data seeded successfully! ✓✓✓\n');
  } catch (error) {
    console.error('Error seeding edge cases:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { main as seedEdgeCases };
