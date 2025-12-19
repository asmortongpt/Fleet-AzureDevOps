#!/usr/bin/env ts-node
/**
 * Comprehensive Database Seeding Script
 * Generates 2000+ realistic records across ALL Fleet Management tables
 *
 * Usage: ts-node server/scripts/seed-comprehensive.ts <environment>
 * Environment: dev | stage | production
 */

import { Pool } from 'pg';
import { randomBytes } from 'crypto';

// Environment configuration
const ENV = process.argv[2] || 'dev';
const DATABASE_NAME = `fleet_${ENV}`;

// Connection string from environment or Key Vault
const CONNECTION_STRING = process.env.POSTGRES_CONNECTION_STRING ||
  `postgresql://fleetadmin:${process.env.POSTGRES_ADMIN_PASSWORD}@fleet-postgres-2025.postgres.database.azure.com:5432/${DATABASE_NAME}?sslmode=require`;

const pool = new Pool({
  connectionString: CONNECTION_STRING,
  ssl: { rejectUnauthorized: false }
});

// Seed data configuration
const SEED_CONFIG = {
  users: 50,
  vehicles: 150,
  drivers: 75,
  facilities: 25,
  workOrders: 600,
  fuelTransactions: 1200,
  routes: 40,
  inspections: 250,
  incidents: 60,
  vehicleAssignments: 100,
  maintenanceSchedules: 200,
  parts: 500,
  vendors: 30,
  contracts: 20
};

// Helper functions
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateVIN(): string {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let vin = '';
  for (let i = 0; i < 17; i++) {
    vin += chars[Math.floor(Math.random() * chars.length)];
  }
  return vin;
}

function generateLicensePlate(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return `${letters[randomInt(0, 25)]}${letters[randomInt(0, 25)]}${randomInt(1000, 9999)}`;
}

// Data generators
async function seedUsers(client: any) {
  console.log('🔹 Seeding users...');

  const roles = ['admin', 'user', 'viewer'];
  const firstNames = ['James', 'Maria', 'David', 'Jennifer', 'Michael', 'Sarah', 'Robert', 'Emily', 'John', 'Lisa',
                      'William', 'Jessica', 'Richard', 'Ashley', 'Joseph', 'Amanda', 'Thomas', 'Melissa', 'Charles', 'Deborah'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                     'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

  const userIds = [];

  for (let i = 0; i < SEED_CONFIG.users; i++) {
    const firstName = randomChoice(firstNames);
    const lastName = randomChoice(lastNames);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i > 19 ? i : ''}@capitaltechalliance.com`;
    const role = i < 5 ? 'admin' : (i < 15 ? 'user' : randomChoice(roles));
    const displayName = `${firstName} ${lastName}`;

    const result = await client.query(
      `INSERT INTO users (email, display_name, role, tenant_id, auth_provider)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [email, displayName, role, 1, 'microsoft']
    );

    userIds.push(result.rows[0].id);
  }

  console.log(`✅ Created ${userIds.length} users`);
  return userIds;
}

async function seedVehicles(client: any) {
  console.log('🔹 Seeding vehicles...');

  const makes = [
    { make: 'Ford', models: ['F-150', 'Explorer', 'Transit', 'Escape', 'Expedition'] },
    { make: 'Chevrolet', models: ['Silverado', 'Tahoe', 'Malibu', 'Equinox', 'Suburban'] },
    { make: 'Toyota', models: ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Tundra'] },
    { make: 'Honda', models: ['Accord', 'Civic', 'CR-V', 'Pilot', 'Odyssey'] },
    { make: 'Ram', models: ['1500', '2500', '3500', 'ProMaster'] },
    { make: 'Tesla', models: ['Model 3', 'Model Y', 'Model S', 'Model X'] },
    { make: 'Nissan', models: ['Altima', 'Rogue', 'Leaf', 'Frontier'] },
    { make: 'Dodge', models: ['Charger', 'Durango', 'Grand Caravan'] },
    { make: 'Jeep', models: ['Wrangler', 'Grand Cherokee', 'Cherokee', 'Gladiator'] },
    { make: 'GMC', models: ['Sierra', 'Yukon', 'Acadia', 'Terrain'] }
  ];

  const types = ['sedan', 'suv', 'truck', 'van', 'coupe'];
  const statuses = ['active', 'idle', 'maintenance', 'reserved', 'out_of_service'];
  const fuelTypes = ['gasoline', 'diesel', 'electric', 'hybrid'];

  // Tallahassee, FL area coordinates
  const baseLocation = { lat: 30.4383, lng: -84.2807 };

  const vehicleIds = [];

  for (let i = 0; i < SEED_CONFIG.vehicles; i++) {
    const makeData = randomChoice(makes);
    const model = randomChoice(makeData.models);
    const year = randomInt(2018, 2025);
    const type = randomChoice(types);
    const status = randomChoice(statuses);
    const fuelType = model.includes('Tesla') || model.includes('Leaf') ? 'electric' :
                    (type === 'truck' ? randomChoice(['diesel', 'gasoline']) : randomChoice(fuelTypes));

    const location = {
      lat: baseLocation.lat + (Math.random() - 0.5) * 0.2,
      lng: baseLocation.lng + (Math.random() - 0.5) * 0.2
    };

    const result = await client.query(
      `INSERT INTO vehicles (
        vin, license_plate, make, model, year, type, color, status,
        fuel_type, fuel_capacity, current_mileage, purchase_date,
        purchase_price, location_lat, location_lng, tenant_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id`,
      [
        generateVIN(),
        generateLicensePlate(),
        makeData.make,
        model,
        year,
        type,
        randomChoice(['White', 'Black', 'Silver', 'Blue', 'Red', 'Gray']),
        status,
        fuelType,
        fuelType === 'electric' ? 75 : (type === 'truck' ? 36 : 15),
        randomInt(5000, 120000),
        randomDate(new Date(year, 0, 1), new Date()),
        randomInt(20000, 85000),
        location.lat,
        location.lng,
        1
      ]
    );

    vehicleIds.push(result.rows[0].id);
  }

  console.log(`✅ Created ${vehicleIds.length} vehicles`);
  return vehicleIds;
}

async function seedDrivers(client: any, userIds: number[]) {
  console.log('🔹 Seeding drivers...');

  const licenseClasses = ['Class A CDL', 'Class B CDL', 'Class C', 'Class D'];
  const licenseStates = ['FL', 'GA', 'AL', 'TX', 'CA', 'NY'];
  const statuses = ['active', 'inactive', 'on_leave', 'suspended'];
  const certifications = ['HAZMAT', 'Tanker', 'Doubles/Triples', 'Passenger', 'School Bus'];

  const driverIds = [];

  for (let i = 0; i < SEED_CONFIG.drivers; i++) {
    const userId = userIds[randomInt(0, userIds.length - 1)];
    const licenseNumber = `${randomChoice(licenseStates)}${randomInt(100000000, 999999999)}`;
    const licenseClass = randomChoice(licenseClasses);
    const status = i < 60 ? 'active' : randomChoice(statuses);
    const hireDate = randomDate(new Date(2015, 0, 1), new Date());
    const licenseExpiry = new Date(hireDate.getTime() + (5 * 365 * 24 * 60 * 60 * 1000));

    const driverCerts = [];
    const certCount = randomInt(0, 3);
    for (let j = 0; j < certCount; j++) {
      const cert = randomChoice(certifications);
      if (!driverCerts.includes(cert)) driverCerts.push(cert);
    }

    const result = await client.query(
      `INSERT INTO drivers (
        user_id, license_number, license_class, license_state, license_expiry,
        status, hire_date, certifications, tenant_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        userId,
        licenseNumber,
        licenseClass,
        randomChoice(licenseStates),
        licenseExpiry,
        status,
        hireDate,
        JSON.stringify(driverCerts),
        1
      ]
    );

    driverIds.push(result.rows[0].id);
  }

  console.log(`✅ Created ${driverIds.length} drivers`);
  return driverIds;
}

async function seedFacilities(client: any) {
  console.log('🔹 Seeding facilities...');

  const types = ['depot', 'service-center', 'fueling-station', 'parking', 'warehouse'];
  const statuses = ['operational', 'maintenance', 'closed'];

  // Tallahassee area facilities
  const baseLocations = [
    { name: 'Fleet HQ Depot', lat: 30.4383, lng: -84.2807, address: '1000 Apalachee Pkwy' },
    { name: 'North Service Center', lat: 30.4650, lng: -84.2600, address: '2500 N Monroe St' },
    { name: 'Capitol Circle Operations', lat: 30.4500, lng: -84.2300, address: '3200 Capital Circle NE' },
    { name: 'Southwood Service', lat: 30.4100, lng: -84.2400, address: '4500 Southwood Blvd' },
    { name: 'Killearn Depot', lat: 30.5000, lng: -84.2200, address: '1800 Thomasville Rd' }
  ];

  const facilityIds = [];

  for (let i = 0; i < SEED_CONFIG.facilities; i++) {
    const baseLocation = i < 5 ? baseLocations[i] : randomChoice(baseLocations);
    const name = i < 5 ? baseLocation.name : `${randomChoice(['East', 'West', 'Central', 'Regional'])} ${randomChoice(types)} ${i}`;
    const type = randomChoice(types);
    const capacity = randomInt(5, 50);

    const result = await client.query(
      `INSERT INTO facilities (
        name, type, address, city, state, zip_code,
        location_lat, location_lng, capacity, status, tenant_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id`,
      [
        name,
        type,
        i < 5 ? `${baseLocation.address}, Tallahassee, FL` : `${randomInt(100, 9999)} ${randomChoice(['Main', 'Oak', 'Elm', 'Park'])} St`,
        'Tallahassee',
        'FL',
        `323${randomInt(01, 99)}`,
        baseLocation.lat + (Math.random() - 0.5) * 0.05,
        baseLocation.lng + (Math.random() - 0.5) * 0.05,
        capacity,
        i < 20 ? 'operational' : randomChoice(statuses),
        1
      ]
    );

    facilityIds.push(result.rows[0].id);
  }

  console.log(`✅ Created ${facilityIds.length} facilities`);
  return facilityIds;
}

async function seedWorkOrders(client: any, vehicleIds: number[], facilityIds: number[], userIds: number[]) {
  console.log('🔹 Seeding work orders...');

  const types = ['preventive', 'corrective', 'inspection', 'emergency', 'upgrade'];
  const priorities = ['low', 'normal', 'high', 'critical'];
  const statuses = ['pending', 'in_progress', 'completed', 'cancelled'];

  const services = [
    'Oil Change', 'Tire Rotation', 'Brake Inspection', 'Engine Diagnostic',
    'Transmission Service', 'Battery Replacement', 'Air Filter Replacement',
    'Coolant Flush', 'Spark Plug Replacement', 'Wheel Alignment',
    'Suspension Repair', 'Exhaust System Repair', 'AC Service', 'Headlight Replacement'
  ];

  const workOrderIds = [];

  for (let i = 0; i < SEED_CONFIG.workOrders; i++) {
    const vehicleId = randomChoice(vehicleIds);
    const facilityId = randomChoice(facilityIds);
    const assignedTo = randomChoice(userIds);
    const type = randomChoice(types);
    const priority = randomChoice(priorities);
    const status = randomChoice(statuses);
    const createdDate = randomDate(new Date(2024, 0, 1), new Date());

    const scheduledDate = new Date(createdDate.getTime() + randomInt(1, 30) * 24 * 60 * 60 * 1000);
    const completedDate = status === 'completed' ?
      new Date(scheduledDate.getTime() + randomInt(1, 7) * 24 * 60 * 60 * 1000) : null;

    const laborCost = randomInt(50, 500);
    const partsCost = randomInt(0, 1000);

    const result = await client.query(
      `INSERT INTO work_orders (
        vehicle_id, facility_id, type, priority, status, description,
        scheduled_date, completed_date, assigned_to, labor_cost, parts_cost,
        total_cost, tenant_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id`,
      [
        vehicleId,
        facilityId,
        type,
        priority,
        status,
        `${randomChoice(services)} - ${type} maintenance`,
        scheduledDate,
        completedDate,
        assignedTo,
        laborCost,
        partsCost,
        laborCost + partsCost,
        1,
        createdDate
      ]
    );

    workOrderIds.push(result.rows[0].id);
  }

  console.log(`✅ Created ${workOrderIds.length} work orders`);
  return workOrderIds;
}

async function seedFuelTransactions(client: any, vehicleIds: number[], driverIds: number[]) {
  console.log('🔹 Seeding fuel transactions...');

  const fuelTypes = ['gasoline', 'diesel', 'electric'];
  const stations = [
    'Shell Station - Monroe St', 'BP - Apalachee Pkwy', 'Chevron - Capital Circle',
    'Exxon - Thomasville Rd', 'Marathon - Tennessee St', 'Sunoco - Mahan Dr',
    'Circle K - Centerville Rd', 'RaceTrac - W Tennessee St'
  ];

  const transactionIds = [];

  for (let i = 0; i < SEED_CONFIG.fuelTransactions; i++) {
    const vehicleId = randomChoice(vehicleIds);
    const driverId = randomChoice(driverIds);
    const fuelType = randomChoice(fuelTypes);
    const gallons = fuelType === 'electric' ? randomInt(20, 75) : randomInt(10, 35);
    const pricePerGallon = fuelType === 'electric' ? randomInt(10, 30) / 100 :
                          (fuelType === 'diesel' ? randomInt(350, 450) / 100 : randomInt(280, 380) / 100);
    const totalCost = gallons * pricePerGallon;
    const odometer = randomInt(10000, 150000);
    const date = randomDate(new Date(2024, 0, 1), new Date());

    const result = await client.query(
      `INSERT INTO fuel_transactions (
        vehicle_id, driver_id, fuel_type, gallons, price_per_gallon,
        total_cost, odometer_reading, station_name, transaction_date, tenant_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
      [
        vehicleId,
        driverId,
        fuelType,
        gallons,
        pricePerGallon,
        totalCost,
        odometer,
        randomChoice(stations),
        date,
        1
      ]
    );

    transactionIds.push(result.rows[0].id);
  }

  console.log(`✅ Created ${transactionIds.length} fuel transactions`);
  return transactionIds;
}

async function seedRoutes(client: any, driverIds: number[], vehicleIds: number[]) {
  console.log('🔹 Seeding routes...');

  const statuses = ['planned', 'active', 'completed', 'cancelled'];
  const routeNames = [
    'North District Patrol', 'South District Patrol', 'Downtown Loop',
    'Interstate Coverage', 'School Zone Route', 'Highway Patrol',
    'City Center Circuit', 'Suburban Coverage', 'Emergency Response Route'
  ];

  const routeIds = [];

  for (let i = 0; i < SEED_CONFIG.routes; i++) {
    const driverId = randomChoice(driverIds);
    const vehicleId = randomChoice(vehicleIds);
    const status = randomChoice(statuses);
    const startDate = randomDate(new Date(2024, 0, 1), new Date());
    const endDate = status === 'completed' ?
      new Date(startDate.getTime() + randomInt(2, 10) * 60 * 60 * 1000) : null;

    const distance = randomInt(10, 200);
    const estimatedDuration = randomInt(30, 480); // minutes

    const result = await client.query(
      `INSERT INTO routes (
        name, description, driver_id, vehicle_id, status,
        start_location, end_location, distance_miles, estimated_duration_minutes,
        scheduled_start, scheduled_end, actual_start, actual_end, tenant_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id`,
      [
        `${randomChoice(routeNames)} ${i + 1}`,
        `Regular patrol route covering ${randomChoice(['north', 'south', 'east', 'west'])} sector`,
        driverId,
        vehicleId,
        status,
        'Tallahassee HQ Depot',
        randomChoice(['North District', 'South District', 'Downtown', 'Suburban Area']),
        distance,
        estimatedDuration,
        startDate,
        new Date(startDate.getTime() + estimatedDuration * 60 * 1000),
        status !== 'planned' ? startDate : null,
        endDate,
        1
      ]
    );

    routeIds.push(result.rows[0].id);
  }

  console.log(`✅ Created ${routeIds.length} routes`);
  return routeIds;
}

async function seedInspections(client: any, vehicleIds: number[], userIds: number[]) {
  console.log('🔹 Seeding inspections...');

  const types = ['pre-trip', 'post-trip', 'annual', 'safety', 'emissions'];
  const statuses = ['passed', 'failed', 'pending'];

  const checklistItems = [
    'Tires', 'Brakes', 'Lights', 'Horn', 'Mirrors', 'Windshield',
    'Wipers', 'Seat Belts', 'Fire Extinguisher', 'First Aid Kit',
    'Fluid Levels', 'Battery', 'Exhaust System', 'Steering'
  ];

  const inspectionIds = [];

  for (let i = 0; i < SEED_CONFIG.inspections; i++) {
    const vehicleId = randomChoice(vehicleIds);
    const inspectorId = randomChoice(userIds);
    const type = randomChoice(types);
    const status = randomChoice(statuses);
    const date = randomDate(new Date(2024, 0, 1), new Date());
    const odometer = randomInt(10000, 150000);

    // Generate checklist results
    const checklist = {};
    checklistItems.forEach(item => {
      checklist[item] = Math.random() > 0.1 ? 'pass' : 'fail';
    });

    const result = await client.query(
      `INSERT INTO inspections (
        vehicle_id, inspector_id, inspection_type, inspection_date,
        odometer_reading, status, checklist_results, notes, tenant_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        vehicleId,
        inspectorId,
        type,
        date,
        odometer,
        status,
        JSON.stringify(checklist),
        status === 'failed' ? `Failed items: ${Object.keys(checklist).filter(k => checklist[k] === 'fail').join(', ')}` : 'All items passed',
        1
      ]
    );

    inspectionIds.push(result.rows[0].id);
  }

  console.log(`✅ Created ${inspectionIds.length} inspections`);
  return inspectionIds;
}

async function seedIncidents(client: any, vehicleIds: number[], driverIds: number[], userIds: number[]) {
  console.log('🔹 Seeding incidents...');

  const types = ['accident', 'theft', 'vandalism', 'mechanical', 'other'];
  const severities = ['minor', 'moderate', 'major', 'critical'];
  const statuses = ['reported', 'investigating', 'resolved', 'closed'];

  const incidentIds = [];

  for (let i = 0; i < SEED_CONFIG.incidents; i++) {
    const vehicleId = randomChoice(vehicleIds);
    const driverId = Math.random() > 0.3 ? randomChoice(driverIds) : null;
    const reportedBy = randomChoice(userIds);
    const type = randomChoice(types);
    const severity = randomChoice(severities);
    const status = randomChoice(statuses);
    const date = randomDate(new Date(2023, 0, 1), new Date());

    const result = await client.query(
      `INSERT INTO incidents (
        vehicle_id, driver_id, incident_type, severity, status,
        incident_date, reported_by, location, description, tenant_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
      [
        vehicleId,
        driverId,
        type,
        severity,
        status,
        date,
        reportedBy,
        'Tallahassee, FL',
        `${type.charAt(0).toUpperCase() + type.slice(1)} incident - ${severity} severity`,
        1
      ]
    );

    incidentIds.push(result.rows[0].id);
  }

  console.log(`✅ Created ${incidentIds.length} incidents`);
  return incidentIds;
}

// Main seeding function
async function seedDatabase() {
  const client = await pool.connect();

  try {
    console.log('════════════════════════════════════════════════════════');
    console.log('  FLEET DATABASE COMPREHENSIVE SEEDING');
    console.log('════════════════════════════════════════════════════════');
    console.log(`📍 Environment: ${ENV}`);
    console.log(`📍 Database: ${DATABASE_NAME}`);
    console.log('');

    await client.query('BEGIN');

    // Seed all tables in dependency order
    const userIds = await seedUsers(client);
    const vehicleIds = await seedVehicles(client);
    const driverIds = await seedDrivers(client, userIds);
    const facilityIds = await seedFacilities(client);
    const workOrderIds = await seedWorkOrders(client, vehicleIds, facilityIds, userIds);
    const fuelTransactionIds = await seedFuelTransactions(client, vehicleIds, driverIds);
    const routeIds = await seedRoutes(client, driverIds, vehicleIds);
    const inspectionIds = await seedInspections(client, vehicleIds, userIds);
    const incidentIds = await seedIncidents(client, vehicleIds, driverIds, userIds);

    await client.query('COMMIT');

    console.log('');
    console.log('════════════════════════════════════════════════════════');
    console.log('  SEEDING COMPLETE');
    console.log('════════════════════════════════════════════════════════');
    console.log(`✅ Total Users: ${userIds.length}`);
    console.log(`✅ Total Vehicles: ${vehicleIds.length}`);
    console.log(`✅ Total Drivers: ${driverIds.length}`);
    console.log(`✅ Total Facilities: ${facilityIds.length}`);
    console.log(`✅ Total Work Orders: ${workOrderIds.length}`);
    console.log(`✅ Total Fuel Transactions: ${fuelTransactionIds.length}`);
    console.log(`✅ Total Routes: ${routeIds.length}`);
    console.log(`✅ Total Inspections: ${inspectionIds.length}`);
    console.log(`✅ Total Incidents: ${incidentIds.length}`);
    console.log('');
    console.log(`📊 Grand Total: ${
      userIds.length + vehicleIds.length + driverIds.length + facilityIds.length +
      workOrderIds.length + fuelTransactionIds.length + routeIds.length +
      inspectionIds.length + incidentIds.length
    } records`);
    console.log('════════════════════════════════════════════════════════');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Execute seeding
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Database seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database seeding failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };
