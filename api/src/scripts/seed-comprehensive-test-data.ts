#!/usr/bin/env node
/**
 * COMPREHENSIVE Test Data Seed Script - COMPLETE COVERAGE
 * Creates 2000+ records covering EVERY possible condition, status, and edge case
 * Run with: npm run seed
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';

dotenv.config({ path: '../.env' });

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '15432'),
  database: process.env.DB_NAME || 'fleetdb',
  user: process.env.DB_USER || 'fleetadmin',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// ============================================
// COMPREHENSIVE DATA TEMPLATES
// ============================================

// Florida cities with coordinates (expanded)
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
  { name: 'Pensacola', lat: 30.4213, lng: -87.2169 },
  { name: 'St. Petersburg', lat: 27.7676, lng: -82.6403 },
  { name: 'Cape Coral', lat: 26.5629, lng: -81.9495 },
  { name: 'Fort Myers', lat: 26.6406, lng: -81.8723 },
  { name: 'Sarasota', lat: 27.3364, lng: -82.5307 },
  { name: 'Lakeland', lat: 28.0395, lng: -81.9498 },
  { name: 'Daytona Beach', lat: 29.2108, lng: -81.0228 },
  { name: 'Melbourne', lat: 28.0836, lng: -80.6081 },
  { name: 'Key West', lat: 24.5551, lng: -81.7800 }
];

// Comprehensive vehicle templates - ALL types, fuel types, makes
const vehicleTemplates = [
  // Cars/Sedans
  { make: 'Honda', model: 'Accord', type: 'Sedan', fuelType: 'Gasoline', weight: 'light' },
  { make: 'Toyota', model: 'Camry', type: 'Sedan', fuelType: 'Gasoline', weight: 'light' },
  { make: 'Tesla', model: 'Model 3', type: 'Sedan', fuelType: 'Electric', weight: 'light' },
  { make: 'Toyota', model: 'Prius', type: 'Sedan', fuelType: 'Hybrid', weight: 'light' },

  // SUVs
  { make: 'Ford', model: 'Explorer', type: 'SUV', fuelType: 'Gasoline', weight: 'medium' },
  { make: 'Chevrolet', model: 'Tahoe', type: 'SUV', fuelType: 'Gasoline', weight: 'medium' },
  { make: 'Tesla', model: 'Model Y', type: 'SUV', fuelType: 'Electric', weight: 'medium' },
  { make: 'Toyota', model: 'Highlander Hybrid', type: 'SUV', fuelType: 'Hybrid', weight: 'medium' },
  { make: 'Jeep', model: 'Wrangler', type: 'SUV', fuelType: 'Gasoline', weight: 'medium' },

  // Pickup Trucks
  { make: 'Ford', model: 'F-150', type: 'Pickup Truck', fuelType: 'Gasoline', weight: 'medium' },
  { make: 'Ford', model: 'F-250 Super Duty', type: 'Pickup Truck', fuelType: 'Diesel', weight: 'heavy' },
  { make: 'Ford', model: 'F-350 Super Duty', type: 'Pickup Truck', fuelType: 'Diesel', weight: 'heavy' },
  { make: 'Chevrolet', model: 'Silverado 1500', type: 'Pickup Truck', fuelType: 'Gasoline', weight: 'medium' },
  { make: 'Chevrolet', model: 'Silverado 2500HD', type: 'Pickup Truck', fuelType: 'Diesel', weight: 'heavy' },
  { make: 'RAM', model: '1500', type: 'Pickup Truck', fuelType: 'Gasoline', weight: 'medium' },
  { make: 'RAM', model: '2500', type: 'Pickup Truck', fuelType: 'Diesel', weight: 'heavy' },
  { make: 'RAM', model: '3500', type: 'Pickup Truck', fuelType: 'Diesel', weight: 'heavy' },
  { make: 'Toyota', model: 'Tacoma', type: 'Pickup Truck', fuelType: 'Gasoline', weight: 'medium' },
  { make: 'Toyota', model: 'Tundra', type: 'Pickup Truck', fuelType: 'Gasoline', weight: 'medium' },
  { make: 'GMC', model: 'Sierra 1500', type: 'Pickup Truck', fuelType: 'Gasoline', weight: 'medium' },
  { make: 'GMC', model: 'Sierra 2500HD', type: 'Pickup Truck', fuelType: 'Diesel', weight: 'heavy' },
  { make: 'Rivian', model: 'R1T', type: 'Pickup Truck', fuelType: 'Electric', weight: 'medium' },
  { make: 'Ford', model: 'F-150 Lightning', type: 'Pickup Truck', fuelType: 'Electric', weight: 'medium' },

  // Cargo Vans
  { make: 'Ford', model: 'Transit', type: 'Cargo Van', fuelType: 'Gasoline', weight: 'medium' },
  { make: 'Ford', model: 'Transit', type: 'Cargo Van', fuelType: 'Diesel', weight: 'medium' },
  { make: 'Ford', model: 'E-Transit', type: 'Cargo Van', fuelType: 'Electric', weight: 'medium' },
  { make: 'Mercedes-Benz', model: 'Sprinter', type: 'Cargo Van', fuelType: 'Diesel', weight: 'medium' },
  { make: 'Mercedes-Benz', model: 'eSprinter', type: 'Cargo Van', fuelType: 'Electric', weight: 'medium' },
  { make: 'Chevrolet', model: 'Express', type: 'Cargo Van', fuelType: 'Gasoline', weight: 'medium' },
  { make: 'RAM', model: 'ProMaster', type: 'Cargo Van', fuelType: 'Gasoline', weight: 'medium' },
  { make: 'Nissan', model: 'NV Cargo', type: 'Cargo Van', fuelType: 'Gasoline', weight: 'medium' },

  // Passenger Vans
  { make: 'Ford', model: 'Transit Passenger', type: 'Passenger Van', fuelType: 'Gasoline', weight: 'medium' },
  { make: 'Chevrolet', model: 'Express Passenger', type: 'Passenger Van', fuelType: 'Gasoline', weight: 'medium' },
  { make: 'Mercedes-Benz', model: 'Sprinter Passenger', type: 'Passenger Van', fuelType: 'Diesel', weight: 'medium' },

  // Box Trucks
  { make: 'Isuzu', model: 'NPR', type: 'Box Truck', fuelType: 'Diesel', weight: 'heavy' },
  { make: 'Freightliner', model: 'M2 106', type: 'Box Truck', fuelType: 'Diesel', weight: 'heavy' },
  { make: 'International', model: 'CV', type: 'Box Truck', fuelType: 'Diesel', weight: 'heavy' },
  { make: 'Hino', model: '195', type: 'Box Truck', fuelType: 'Diesel', weight: 'heavy' },

  // Semi-Trucks/Tractors
  { make: 'Freightliner', model: 'Cascadia', type: 'Semi-Truck', fuelType: 'Diesel', weight: 'heavy' },
  { make: 'Volvo', model: 'VNL', type: 'Semi-Truck', fuelType: 'Diesel', weight: 'heavy' },
  { make: 'Kenworth', model: 'T680', type: 'Semi-Truck', fuelType: 'Diesel', weight: 'heavy' },
  { make: 'Peterbilt', model: '579', type: 'Semi-Truck', fuelType: 'Diesel', weight: 'heavy' },
  { make: 'Mack', model: 'Anthem', type: 'Semi-Truck', fuelType: 'Diesel', weight: 'heavy' },
  { make: 'Tesla', model: 'Semi', type: 'Semi-Truck', fuelType: 'Electric', weight: 'heavy' },

  // Specialty Vehicles
  { make: 'Freightliner', model: 'M2 Dump', type: 'Dump Truck', fuelType: 'Diesel', weight: 'heavy' },
  { make: 'International', model: 'HV', type: 'Dump Truck', fuelType: 'Diesel', weight: 'heavy' },
  { make: 'Ford', model: 'F-550 Tow Truck', type: 'Tow Truck', fuelType: 'Diesel', weight: 'heavy' },
  { make: 'Freightliner', model: 'Business Class M2 Flatbed', type: 'Flatbed Truck', fuelType: 'Diesel', weight: 'heavy' },
  { make: 'Isuzu', model: 'NPR Refrigerated', type: 'Refrigerated Truck', fuelType: 'Diesel', weight: 'heavy' },
  { make: 'International', model: 'DuraStar Service', type: 'Service Vehicle', fuelType: 'Diesel', weight: 'heavy' },
  { make: 'Kenworth', model: 'T800 Tanker', type: 'Tanker', fuelType: 'Diesel', weight: 'heavy' },

  // Alternative Fuels
  { make: 'Ford', model: 'F-250 CNG', type: 'Pickup Truck', fuelType: 'CNG', weight: 'medium' },
  { make: 'Chevrolet', model: 'Silverado CNG', type: 'Pickup Truck', fuelType: 'CNG', weight: 'medium' },
  { make: 'Blue Bird', model: 'Vision Propane', type: 'Bus', fuelType: 'Propane', weight: 'heavy' }
];

// ALL possible vehicle statuses
const vehicleStatuses = ['active', 'maintenance', 'out_of_service', 'sold', 'retired'];

// ALL possible user roles and states
const userRoles = ['admin', 'fleet_manager', 'driver', 'technician', 'viewer'];
const userStates = [true, true, true, true, false]; // 80% active, 20% inactive

// Driver statuses
const driverStatuses = ['active', 'on_leave', 'suspended', 'terminated'];

// CDL classes and endorsements
const cdlClasses = ['A', 'B', 'C', null];
const cdlEndorsements = [
  ['H'], // Hazmat
  ['N'], // Tank
  ['P'], // Passenger
  ['T'], // Double/Triple trailers
  ['H', 'N'], // Hazmat + Tank
  ['H', 'N', 'T'], // Multiple
  ['P', 'N'], // Passenger + Tank
  []
];

// ALL maintenance/service types
const maintenanceTypes = [
  'Oil Change',
  'Oil Filter Replacement',
  'Tire Rotation',
  'Tire Replacement',
  'Tire Balancing',
  'Wheel Alignment',
  'Brake Inspection',
  'Brake Pad Replacement',
  'Brake Rotor Replacement',
  'Brake Fluid Flush',
  'Battery Replacement',
  'Battery Test',
  'Air Filter Replacement',
  'Cabin Air Filter Replacement',
  'Transmission Service',
  'Transmission Fluid Change',
  'Transmission Rebuild',
  'Coolant Flush',
  'Radiator Replacement',
  'Water Pump Replacement',
  'Thermostat Replacement',
  'AC System Service',
  'AC Compressor Replacement',
  'AC Recharge',
  'Engine Tune-up',
  'Spark Plug Replacement',
  'Ignition Coil Replacement',
  'Fuel Filter Replacement',
  'Fuel Pump Replacement',
  'Fuel Injector Cleaning',
  'Suspension Inspection',
  'Shock Absorber Replacement',
  'Strut Replacement',
  'Control Arm Replacement',
  'Ball Joint Replacement',
  'Windshield Wiper Replacement',
  'Windshield Replacement',
  'Headlight Replacement',
  'Taillight Replacement',
  'Alternator Replacement',
  'Starter Replacement',
  'Timing Belt Replacement',
  'Serpentine Belt Replacement',
  'Exhaust System Repair',
  'Muffler Replacement',
  'Catalytic Converter Replacement',
  'O2 Sensor Replacement',
  'DOT Safety Inspection',
  'State Inspection',
  'Emission Test',
  'Annual Safety Inspection',
  'Pre-Trip Inspection',
  'Post-Trip Inspection',
  'DEF System Service',
  'DPF Cleaning',
  'Turbocharger Replacement',
  'EGR Valve Replacement',
  'Powertrain Diagnostic',
  'Engine Replacement',
  'Clutch Replacement',
  'Differential Service',
  'Transfer Case Service',
  'PTO Service',
  'Hydraulic System Service',
  'Air Brake System Service',
  'Spring Brake Replacement',
  'Glad Hand Replacement',
  'Fifth Wheel Service',
  'Kingpin Inspection',
  'Landing Gear Service',
  'Trailer Coupling Inspection',
  'Reefer Unit Service',
  'Liftgate Repair',
  'Body Work',
  'Paint Touch-up',
  'Rust Repair',
  'Recall Service',
  'Warranty Repair',
  'Accident Repair',
  'Vandalism Repair',
  'Weather Damage Repair'
];

// Work order priorities and statuses
const workOrderPriorities = ['low', 'medium', 'high', 'critical'];
const workOrderStatuses = ['open', 'in_progress', 'on_hold', 'completed', 'cancelled'];
const workOrderTypes = ['preventive', 'corrective', 'inspection'];

// Route statuses
const routeStatuses = ['planned', 'in_progress', 'completed', 'cancelled'];

// Incident types and severities
const incidentTypes = ['accident', 'injury', 'near_miss', 'property_damage', 'citation', 'equipment_failure'];
const incidentSeverities = ['minor', 'moderate', 'severe', 'fatal'];

// Inspection types and results
const inspectionTypes = ['pre_trip', 'post_trip', 'safety', 'dot', 'state', 'annual'];
const inspectionResults = ['pass', 'fail', 'needs_repair'];

// Helper functions
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

function monthsAgo(months: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date;
}

function yearsAgo(years: number): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date;
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
  return `FL${randomInt(100, 999)}${String.fromCharCode(65 + randomInt(0, 25))}${String.fromCharCode(65 + randomInt(0, 25))}${String.fromCharCode(65 + randomInt(0, 25))}`;
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

// Data quality variations
function maybeNull<T>(value: T, probabilityOfNull: number = 0.1): T | null {
  return Math.random() < probabilityOfNull ? null : value;
}

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function seedDatabase() {
  const client = await pool.connect();

  try {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  COMPREHENSIVE TEST DATA SEED - COMPLETE COVERAGE            ║');
    console.log('║  Creating 2000+ records covering ALL conditions and states  ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    await client.query('BEGIN');

    // Default password for all test users
    const defaultPassword = await bcrypt.hash('TestPassword123!', 12);

    // Tracking counters
    let totalRecords = 0;
    const counters = {
      tenants: 0,
      users: 0,
      vehicles: 0,
      drivers: 0,
      facilities: 0,
      fuelTransactions: 0,
      workOrders: 0,
      maintenanceSchedules: 0,
      routes: 0,
      geofences: 0,
      inspections: 0,
      safetyIncidents: 0,
      telemetryData: 0,
      notifications: 0,
      vendors: 0,
      purchaseOrders: 0,
      chargingStations: 0,
      chargingSessions: 0,
      auditLogs: 0
    };

    // ========================================
    // 1. TENANTS - 5 Different Scenarios
    // ========================================
    console.log('📦 Creating tenants (multi-scenario coverage)...');

    const tenantConfigs = [
      {
        name: 'Small Fleet Transport',
        domain: 'small-fleet.local',
        tier: 'basic',
        vehicleCount: 8,
        settings: { timezone: 'America/New_York', features: ['basic_tracking', 'maintenance'] }
      },
      {
        name: 'Medium Logistics Company',
        domain: 'medium-logistics.local',
        tier: 'professional',
        vehicleCount: 35,
        settings: { timezone: 'America/New_York', features: ['advanced_tracking', 'maintenance', 'fuel_management', 'routing'] }
      },
      {
        name: 'Enterprise Fleet Services',
        domain: 'enterprise-fleet.local',
        tier: 'enterprise',
        vehicleCount: 120,
        settings: { timezone: 'America/New_York', features: ['all'] }
      },
      {
        name: 'Demo Account - Showcase',
        domain: 'demo-showcase.local',
        tier: 'demo',
        vehicleCount: 25,
        settings: { timezone: 'America/New_York', features: ['all'], demo_mode: true }
      },
      {
        name: 'Test Tenant (Inactive)',
        domain: 'test-inactive.local',
        tier: 'test',
        vehicleCount: 5,
        settings: { timezone: 'America/New_York' }
      }
    ];

    const tenants: any[] = [];
    for (const config of tenantConfigs) {
      const result = await client.query(
        `INSERT INTO tenants (name, domain, settings, is_active)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (domain) DO UPDATE SET name = EXCLUDED.name
         RETURNING *`,
        [config.name, config.domain, JSON.stringify(config.settings), config.tier !== 'test']
      );
      tenants.push({ ...result.rows[0], ...config });
      counters.tenants++;
    }

    console.log(`   ✅ Created ${counters.tenants} tenants with different configurations`);

    // ========================================
    // 2. USERS - ALL Roles and States
    // ========================================
    console.log('👥 Creating users (all roles and states)...');

    const users: any[] = [];

    for (const tenant of tenants) {
      // Admin (always 1)
      const admin = await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active, failed_login_attempts, mfa_enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name
         RETURNING *`,
        [tenant.id, `admin@${tenant.domain}`, defaultPassword, 'Admin', 'User', generatePhoneNumber(), 'admin', true, 0, true]
      );
      users.push(admin.rows[0]);
      counters.users++;

      // Fleet Managers (2-5 depending on size)
      const fmCount = tenant.tier === 'enterprise' ? 5 : tenant.tier === 'professional' ? 3 : 2;
      for (let i = 1; i <= fmCount; i++) {
        const isActive = i === fmCount ? randomItem(userStates) : true; // Last one might be inactive
        const fm = await client.query(
          `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active, last_login_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name
           RETURNING *`,
          [tenant.id, `manager${i}@${tenant.domain}`, defaultPassword, 'Fleet', `Manager ${i}`, generatePhoneNumber(), 'fleet_manager', isActive, isActive ? daysAgo(randomInt(0, 7)) : null]
        );
        users.push(fm.rows[0]);
        counters.users++;
      }

      // Technicians (2-8 depending on size)
      const techCount = tenant.tier === 'enterprise' ? 8 : tenant.tier === 'professional' ? 4 : 2;
      for (let i = 1; i <= techCount; i++) {
        const tech = await client.query(
          `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name
           RETURNING *`,
          [tenant.id, `tech${i}@${tenant.domain}`, defaultPassword, 'Technician', `${i}`, generatePhoneNumber(), 'technician', true]
        );
        users.push(tech.rows[0]);
        counters.users++;
      }

      // Drivers (varies significantly by tenant size)
      const driverCount = Math.ceil(tenant.vehicleCount * 0.7); // 70% of vehicles get assigned drivers
      for (let i = 1; i <= driverCount; i++) {
        const isActive = Math.random() < 0.9; // 90% active
        const failedLogins = isActive ? 0 : randomInt(0, 5);
        const driver = await client.query(
          `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active, failed_login_attempts, last_login_at, account_locked_until)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name
           RETURNING *`,
          [
            tenant.id,
            `driver${i}@${tenant.domain}`,
            defaultPassword,
            `Driver`,
            `${i}`,
            generatePhoneNumber(),
            'driver',
            isActive,
            failedLogins,
            isActive ? daysAgo(randomInt(0, 30)) : null,
            failedLogins >= 5 ? daysFromNow(1) : null
          ]
        );
        users.push(driver.rows[0]);
        counters.users++;
      }

      // Viewers (1-2)
      const viewerCount = tenant.tier === 'enterprise' ? 2 : 1;
      for (let i = 1; i <= viewerCount; i++) {
        const viewer = await client.query(
          `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name
           RETURNING *`,
          [tenant.id, `viewer${i}@${tenant.domain}`, defaultPassword, 'Viewer', `${i}`, generatePhoneNumber(), 'viewer', true]
        );
        users.push(viewer.rows[0]);
        counters.users++;
      }

      // Edge cases: Recently created user (last 24h)
      const newUser = await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name
         RETURNING *`,
        [tenant.id, `newuser@${tenant.domain}`, defaultPassword, 'New', 'User', generatePhoneNumber(), 'driver', true, daysAgo(0)]
      );
      users.push(newUser.rows[0]);
      counters.users++;

      // Inactive user (6+ months)
      const inactiveUser = await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active, last_login_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name
         RETURNING *`,
        [tenant.id, `inactive@${tenant.domain}`, defaultPassword, 'Inactive', 'User', generatePhoneNumber(), 'driver', false, monthsAgo(7)]
      );
      users.push(inactiveUser.rows[0]);
      counters.users++;

      // Suspended user
      const suspendedUser = await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active, account_locked_until, failed_login_attempts)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name
         RETURNING *`,
        [tenant.id, `suspended@${tenant.domain}`, defaultPassword, 'Suspended', 'User', generatePhoneNumber(), 'driver', false, daysFromNow(30), 5]
      );
      users.push(suspendedUser.rows[0]);
      counters.users++;
    }

    console.log(`   ✅ Created ${counters.users} users with all roles and states`);

    // ========================================
    // 3. DRIVERS - Complete Coverage
    // ========================================
    console.log('🚗 Creating driver profiles (all statuses, licenses, certifications)...');

    const drivers: any[] = [];
    const driverUsers = users.filter(u => u.role === 'driver');

    for (const driverUser of driverUsers) {
      const status = randomItem(driverStatuses);
      const cdlClass = randomItem(cdlClasses);
      const endorsements = cdlClass ? randomItem(cdlEndorsements) : [];
      const hireDate = yearsAgo(randomInt(0, 15));
      const terminationDate = status === 'terminated' ? daysAgo(randomInt(30, 365)) : null;
      const licenseExpiration = status === 'terminated' ? daysAgo(randomInt(1, 365)) : daysFromNow(randomInt(-30, 730)); // Some expired
      const medicalExpiration = status === 'terminated' ? daysAgo(randomInt(1, 365)) : daysFromNow(randomInt(-15, 365)); // Some expired
      const safetyScore = status === 'suspended' ? randomFloat(50, 79) : randomFloat(80, 100);
      const incidents = status === 'suspended' ? randomInt(2, 5) : randomInt(0, 2);
      const violations = status === 'suspended' ? randomInt(1, 4) : randomInt(0, 1);

      const driver = await client.query(
        `INSERT INTO drivers (
          tenant_id, user_id, license_number, license_state, license_expiration,
          cdl_class, cdl_endorsements, medical_card_expiration, hire_date, termination_date,
          status, safety_score, total_miles_driven, total_hours_driven, incidents_count, violations_count,
          emergency_contact_name, emergency_contact_phone
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *`,
        [
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
          incidents,
          violations,
          `Emergency Contact ${randomInt(1, 100)}`,
          generatePhoneNumber()
        ]
      );
      drivers.push(driver.rows[0]);
      counters.drivers++;
    }

    console.log(`   ✅ Created ${counters.drivers} driver profiles`);

    // ========================================
    // 4. FACILITIES
    // ========================================
    console.log('🏢 Creating facilities (garages, depots, service centers)...');

    const facilities: any[] = [];
    for (const tenant of tenants) {
      const facilityCount = tenant.tier === 'enterprise' ? 6 : tenant.tier === 'professional' ? 3 : 2;

      for (let i = 0; i < facilityCount; i++) {
        const city = randomItem(floridaCities);
        const types = ['garage', 'depot', 'service_center'];
        const type = randomItem(types);
        const isActive = Math.random() < 0.95; // 5% inactive

        const facility = await client.query(
          `INSERT INTO facilities (
            tenant_id, name, facility_type, address, city, state, zip_code,
            latitude, longitude, phone, capacity, service_bays, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *`,
          [
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
          ]
        );
        facilities.push(facility.rows[0]);
        counters.facilities++;
      }
    }

    console.log(`   ✅ Created ${counters.facilities} facilities`);

    // ========================================
    // 5. VEHICLES - COMPLETE COVERAGE
    // ========================================
    console.log('🚛 Creating vehicles (ALL types, statuses, conditions, ages)...');

    const vehicles: any[] = [];

    for (const tenant of tenants) {
      const tenantDrivers = drivers.filter(d => d.tenant_id === tenant.id && d.status === 'active');
      const tenantDriverUsers = users.filter(u => u.tenant_id === tenant.id && u.role === 'driver' && u.is_active);
      const tenantFacilities = facilities.filter(f => f.tenant_id === tenant.id);

      for (let i = 0; i < tenant.vehicleCount; i++) {
        const template = randomItem(vehicleTemplates);
        const year = randomInt(2015, 2025); // 10-year range for age variations
        const ageInYears = 2025 - year;

        // Status distribution
        let status;
        const statusRoll = Math.random();
        if (statusRoll < 0.70) status = 'active';
        else if (statusRoll < 0.80) status = 'maintenance';
        else if (statusRoll < 0.90) status = 'out_of_service';
        else if (statusRoll < 0.95) status = 'sold';
        else status = 'retired';

        // Mileage based on age and usage
        const baseOdometer = ageInYears * randomInt(8000, 25000);
        const odometer = baseOdometer + randomInt(0, 50000);

        // Purchase details
        const purchaseDate = new Date(year, randomInt(0, 11), randomInt(1, 28));
        const purchasePrice = randomInt(25000, 150000);
        const depreciationRate = 0.15;
        const currentValue = Math.max(5000, purchasePrice * Math.pow(1 - depreciationRate, ageInYears));

        // Assignment - use user_id not driver_id since vehicles.assigned_driver_id references users.id
        const assignedDriver = (status === 'active' && tenantDriverUsers.length > 0 && Math.random() < 0.7)
          ? randomItem(tenantDriverUsers).id
          : null;
        const assignedFacility = tenantFacilities.length > 0 && Math.random() < 0.8
          ? randomItem(tenantFacilities).id
          : null;

        // Location
        const city = randomItem(floridaCities);
        const latitude = city.lat + randomFloat(-0.1, 0.1, 6);
        const longitude = city.lng + randomFloat(-0.1, 0.1, 6);

        // GPS device status
        const hasGPS = Math.random() < 0.95; // 95% have GPS
        const gpsDeviceId = hasGPS ? `GPS-${randomInt(100000, 999999)}` : null;
        const lastGpsUpdate = hasGPS && status === 'active' ? daysAgo(randomInt(0, 1)) : null;

        const vehicle = await client.query(
          `INSERT INTO vehicles (
            tenant_id, vin, make, model, year, license_plate, vehicle_type, fuel_type,
            status, odometer, engine_hours, purchase_date, purchase_price, current_value,
            gps_device_id, last_gps_update, latitude, longitude, speed, heading,
            assigned_driver_id, assigned_facility_id, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
          RETURNING *`,
          [
            tenant.id,
            generateVIN(),
            template.make,
            template.model,
            year,
            generateLicensePlate(),
            template.type,
            template.fuelType,
            status,
            odometer,
            template.fuelType === 'Diesel' ? randomFloat(1000, 15000) : 0,
            purchaseDate,
            purchasePrice,
            currentValue,
            gpsDeviceId,
            lastGpsUpdate,
            latitude,
            longitude,
            status === 'active' && Math.random() < 0.3 ? randomFloat(0, 75) : null,
            status === 'active' && Math.random() < 0.3 ? randomInt(0, 359) : null,
            assignedDriver,
            assignedFacility,
            maybeNull(`${year} ${template.make} ${template.model} - Fleet vehicle`)
          ]
        );
        vehicles.push(vehicle.rows[0]);
        counters.vehicles++;
      }
    }

    console.log(`   ✅ Created ${counters.vehicles} vehicles with complete coverage`);

    // ========================================
    // 6. FUEL TRANSACTIONS - 2 years of history
    // ========================================
    console.log('⛽ Creating fuel transactions (2 years of history)...');

    const fuelPriceHistory: Record<string, number[]> = {
      'Gasoline': [3.45, 3.89],
      'Diesel': [3.89, 4.35],
      'Electric': [0.12, 0.18], // per kWh
      'Hybrid': [3.45, 3.89], // Uses gasoline
      'CNG': [2.50, 3.00],
      'Propane': [2.20, 2.80]
    };

    const fuelStations = [
      'Shell', 'BP', 'Chevron', 'Marathon', 'Sunoco', 'RaceTrac',
      'Circle K', 'Wawa', '7-Eleven', 'Company Depot'
    ];

    for (const vehicle of vehicles) {
      if (vehicle.fuel_type === 'Electric') {
        // Electric vehicles will have charging sessions instead
        continue;
      }

      // 1 year of fuel transactions (varies by vehicle usage) - reduced for performance
      const transactionsPerYear = vehicle.status === 'active' ? randomInt(12, 24) : randomInt(3, 12);
      const totalTransactions = transactionsPerYear; // Only 1 year of data

      for (let i = 0; i < totalTransactions; i++) {
        const daysBack = randomInt(1, 730); // 2 years
        const priceRange = fuelPriceHistory[vehicle.fuel_type] || [3.00, 4.00];
        const gallons = vehicle.vehicle_type.includes('Semi') || vehicle.vehicle_type.includes('Box Truck')
          ? randomFloat(50, 150)
          : vehicle.vehicle_type.includes('Van')
          ? randomFloat(15, 35)
          : randomFloat(10, 25);
        const pricePerGallon = randomFloat(priceRange[0], priceRange[1]);
        const city = randomItem(floridaCities);
        const location = `${randomItem(fuelStations)} - ${city.name}, FL`;
        const odometerReading = Math.max(0, vehicle.odometer - (daysBack * randomInt(10, 100)));

        await client.query(
          `INSERT INTO fuel_transactions (
            tenant_id, vehicle_id, transaction_date, gallons, price_per_gallon,
            odometer_reading, fuel_type, location, latitude, longitude, fuel_card_number
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            vehicle.tenant_id,
            vehicle.id,
            daysAgo(daysBack),
            gallons,
            pricePerGallon,
            odometerReading,
            vehicle.fuel_type,
            location,
            city.lat + randomFloat(-0.05, 0.05, 6),
            city.lng + randomFloat(-0.05, 0.05, 6),
            maybeNull(`FC${randomInt(1000000, 9999999)}`, 0.2)
          ]
        );
        counters.fuelTransactions++;
      }
    }

    console.log(`   ✅ Created ${counters.fuelTransactions} fuel transactions`);

    // ========================================
    // 7. CHARGING STATIONS & SESSIONS (for EVs)
    // ========================================
    console.log('🔌 Creating charging infrastructure...');

    for (const tenant of tenants) {
      const stationCount = tenant.tier === 'enterprise' ? 8 : tenant.tier === 'professional' ? 4 : 2;

      for (let i = 0; i < stationCount; i++) {
        const city = randomItem(floridaCities);
        const types = ['level_1', 'level_2', 'dc_fast_charge'];
        const type = randomItem(types);
        const powerOutput = type === 'dc_fast_charge' ? randomInt(50, 350) : type === 'level_2' ? randomInt(7, 19) : 1.9;

        const station = await client.query(
          `INSERT INTO charging_stations (
            tenant_id, station_name, station_type, location, latitude, longitude,
            number_of_ports, power_output_kw, cost_per_kwh, is_public, is_operational
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *`,
          [
            tenant.id,
            `${city.name} Charging ${i + 1}`,
            type,
            `${randomInt(100, 9999)} ${city.name} Blvd, FL`,
            city.lat + randomFloat(-0.05, 0.05, 6),
            city.lng + randomFloat(-0.05, 0.05, 6),
            randomInt(1, 8),
            powerOutput,
            randomFloat(0.10, 0.25, 4),
            Math.random() < 0.3,
            Math.random() < 0.95
          ]
        );
        counters.chargingStations++;

        // Create charging sessions for EVs (reduced for performance)
        const evVehicles = vehicles.filter(v => v.tenant_id === tenant.id && v.fuel_type === 'Electric');
        for (const ev of evVehicles) {
          const sessionsPerYear = randomInt(20, 50); // Reduced from 100-300
          for (let j = 0; j < sessionsPerYear; j++) {
            const daysBack = randomInt(1, 365);
            const startTime = daysAgo(daysBack);
            const durationMinutes = type === 'dc_fast_charge' ? randomInt(15, 45) : randomInt(60, 240);
            const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
            const energyDelivered = randomFloat(10, 100);
            const cost = energyDelivered * randomFloat(0.10, 0.25);
            const startBattery = randomFloat(10, 40);
            const endBattery = Math.min(100, startBattery + randomFloat(40, 80));

            await client.query(
              `INSERT INTO charging_sessions (
                tenant_id, vehicle_id, charging_station_id, start_time, end_time,
                energy_delivered_kwh, cost, start_battery_level, end_battery_level,
                session_duration, status
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
              [
                tenant.id,
                ev.id,
                station.rows[0].id,
                startTime,
                endTime,
                energyDelivered,
                cost,
                startBattery,
                endBattery,
                durationMinutes,
                'completed'
              ]
            );
            counters.chargingSessions++;
          }
        }
      }
    }

    console.log(`   ✅ Created ${counters.chargingStations} charging stations and ${counters.chargingSessions} charging sessions`);

    // ========================================
    // 8. WORK ORDERS - All Types, Priorities, Statuses
    // ========================================
    console.log('🔧 Creating work orders (all types and statuses)...');

    for (const vehicle of vehicles) {
      const technicians = users.filter(u => u.tenant_id === vehicle.tenant_id && u.role === 'technician');
      const ordersPerVehicle = vehicle.status === 'maintenance' ? randomInt(2, 5) : randomInt(1, 3);

      for (let i = 0; i < ordersPerVehicle; i++) {
        const type = randomItem(workOrderTypes);
        const status = randomItem(workOrderStatuses);
        const priority = randomItem(workOrderPriorities);
        const serviceType = randomItem(maintenanceTypes);
        const createdDays = randomInt(1, 365);
        const scheduledStart = daysFromNow(randomInt(-30, 30));
        const scheduledEnd = daysFromNow(randomInt(-25, 35));

        let actualStart = null;
        let actualEnd = null;
        let laborHours = 0;
        let laborCost = 0;
        let partsCost = 0;

        if (status === 'in_progress') {
          actualStart = daysAgo(randomInt(0, 3));
        } else if (status === 'completed') {
          actualStart = daysAgo(randomInt(5, 60));
          actualEnd = new Date(actualStart.getTime() + randomInt(1, 48) * 3600000);
          laborHours = randomFloat(0.5, 16);
          laborCost = laborHours * randomFloat(75, 125);
          partsCost = randomFloat(50, 5000);
        }

        const assignedTech = technicians.length > 0 ? randomItem(technicians).id : null;
        const facility = facilities.find(f => f.tenant_id === vehicle.tenant_id);

        await client.query(
          `INSERT INTO work_orders (
            tenant_id, work_order_number, vehicle_id, facility_id, assigned_technician_id,
            type, priority, status, description, odometer_reading, engine_hours_reading,
            scheduled_start, scheduled_end, actual_start, actual_end,
            labor_hours, labor_cost, parts_cost, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
          [
            vehicle.tenant_id,
            generateWorkOrderNumber(),
            vehicle.id,
            facility?.id,
            assignedTech,
            type,
            priority,
            status,
            `${serviceType} - ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            vehicle.odometer - randomInt(0, 5000),
            vehicle.engine_hours - randomFloat(0, 100),
            scheduledStart,
            scheduledEnd,
            actualStart,
            actualEnd,
            laborHours,
            laborCost,
            partsCost,
            daysAgo(createdDays)
          ]
        );
        counters.workOrders++;
      }
    }

    console.log(`   ✅ Created ${counters.workOrders} work orders`);

    // ========================================
    // 9. MAINTENANCE SCHEDULES
    // ========================================
    console.log('📋 Creating maintenance schedules...');

    for (const vehicle of vehicles) {
      // Each vehicle gets 3-6 maintenance schedules
      const scheduleCount = randomInt(3, 6);

      for (let i = 0; i < scheduleCount; i++) {
        const serviceType = randomItem(maintenanceTypes);
        const intervalType = randomItem(['miles', 'days']);
        const intervalValue = intervalType === 'miles' ? randomInt(3000, 15000) : randomInt(30, 365);
        const daysBack = randomInt(10, 180);
        const lastServiceDate = daysAgo(daysBack);
        const lastServiceOdometer = vehicle.odometer - (daysBack * randomInt(20, 100));

        let nextServiceDueDate = null;
        let nextServiceDueOdometer = null;

        if (intervalType === 'days') {
          nextServiceDueDate = daysFromNow(intervalValue - daysBack);
        } else {
          nextServiceDueOdometer = lastServiceOdometer + intervalValue;
        }

        await client.query(
          `INSERT INTO maintenance_schedules (
            tenant_id, vehicle_id, service_type, interval_type, interval_value,
            last_service_date, last_service_odometer, next_service_due_date,
            next_service_due_odometer, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            vehicle.tenant_id,
            vehicle.id,
            serviceType,
            intervalType,
            intervalValue,
            lastServiceDate,
            lastServiceOdometer,
            nextServiceDueDate,
            nextServiceDueOdometer,
            vehicle.status !== 'sold' && vehicle.status !== 'retired'
          ]
        );
        counters.maintenanceSchedules++;
      }
    }

    console.log(`   ✅ Created ${counters.maintenanceSchedules} maintenance schedules`);

    // ========================================
    // 10. ROUTES
    // ========================================
    console.log('🗺️  Creating routes (all statuses and scenarios)...');

    const activeVehiclesWithDrivers = vehicles.filter(v => v.assigned_driver_id && v.status === 'active');

    for (const vehicle of activeVehiclesWithDrivers.slice(0, 100)) {
      const routesPerVehicle = randomInt(1, 5);

      for (let i = 0; i < routesPerVehicle; i++) {
        const origin = randomItem(floridaCities);
        const destination = randomItem(floridaCities.filter(c => c.name !== origin.name));
        const status = randomItem(routeStatuses);
        const distance = randomFloat(50, 500);
        const estimatedDuration = Math.ceil(distance / randomFloat(40, 60) * 60); // minutes

        let plannedStart, plannedEnd, actualStart, actualEnd, actualDuration;

        if (status === 'completed') {
          plannedStart = daysAgo(randomInt(1, 90));
          plannedEnd = new Date(plannedStart.getTime() + estimatedDuration * 60000);
          actualStart = new Date(plannedStart.getTime() + randomInt(-30, 30) * 60000);
          actualEnd = new Date(actualStart.getTime() + (estimatedDuration + randomInt(-60, 120)) * 60000);
          actualDuration = Math.floor((actualEnd.getTime() - actualStart.getTime()) / 60000);
        } else if (status === 'in_progress') {
          plannedStart = daysAgo(randomInt(0, 1));
          plannedEnd = new Date(plannedStart.getTime() + estimatedDuration * 60000);
          actualStart = plannedStart;
          actualEnd = null;
          actualDuration = null;
        } else {
          plannedStart = daysFromNow(randomInt(1, 30));
          plannedEnd = new Date(plannedStart.getTime() + estimatedDuration * 60000);
          actualStart = null;
          actualEnd = null;
          actualDuration = null;
        }

        await client.query(
          `INSERT INTO routes (
            tenant_id, route_name, vehicle_id, driver_id, status,
            start_location, end_location, planned_start_time, planned_end_time,
            actual_start_time, actual_end_time, total_distance, estimated_duration, actual_duration
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            vehicle.tenant_id,
            `${origin.name} to ${destination.name}`,
            vehicle.id,
            vehicle.assigned_driver_id,
            status,
            `${origin.name}, FL`,
            `${destination.name}, FL`,
            plannedStart,
            plannedEnd,
            actualStart,
            actualEnd,
            distance,
            estimatedDuration,
            actualDuration
          ]
        );
        counters.routes++;
      }
    }

    console.log(`   ✅ Created ${counters.routes} routes`);

    // ========================================
    // 11. GEOFENCES
    // ========================================
    console.log('📍 Creating geofences...');

    for (const tenant of tenants) {
      const geofenceCount = tenant.tier === 'enterprise' ? 15 : tenant.tier === 'professional' ? 8 : 5;

      for (let i = 0; i < geofenceCount; i++) {
        const city = randomItem(floridaCities);
        const types = ['Customer Site', 'Terminal', 'Restricted Area', 'Service Area', 'Rest Stop', 'Fuel Station'];
        const name = `${city.name} - ${randomItem(types)}`;
        const radius = randomInt(100, 5000); // meters

        await client.query(
          `INSERT INTO geofences (
            tenant_id, name, geofence_type, center_latitude, center_longitude,
            radius, alert_on_entry, alert_on_exit, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            tenant.id,
            name,
            'circular',
            city.lat + randomFloat(-0.1, 0.1, 6),
            city.lng + randomFloat(-0.1, 0.1, 6),
            radius,
            Math.random() < 0.5,
            Math.random() < 0.5,
            Math.random() < 0.95
          ]
        );
        counters.geofences++;
      }
    }

    console.log(`   ✅ Created ${counters.geofences} geofences`);

    // ========================================
    // 12. INSPECTIONS - All Types and Results
    // ========================================
    console.log('✅ Creating inspections (all types and results)...');

    for (const vehicle of vehicles) {
      const inspectionsPerVehicle = randomInt(5, 15); // Reduced from 10-50 for performance

      for (let i = 0; i < inspectionsPerVehicle; i++) {
        const type = randomItem(inspectionTypes);
        const result = randomItem(inspectionResults);
        const daysBack = randomInt(1, 730);
        const inspector = drivers.find(d => d.user_id === vehicle.assigned_driver_id);

        await client.query(
          `INSERT INTO inspections (
            tenant_id, vehicle_id, driver_id, inspection_date, inspection_type,
            odometer_reading, status, form_data, defects_found
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            vehicle.tenant_id,
            vehicle.id,
            inspector?.id,
            daysAgo(daysBack),
            type,
            Math.max(0, vehicle.odometer - (daysBack * randomInt(10, 100))),
            result,
            JSON.stringify({ completed: true, notes: 'Inspection complete' }),
            result !== 'pass' ? 'Minor issues found' : null
          ]
        );
        counters.inspections++;
      }
    }

    console.log(`   ✅ Created ${counters.inspections} inspections`);

    // ========================================
    // 13. SAFETY INCIDENTS
    // ========================================
    console.log('⚠️  Creating safety incidents...');

    // Create incidents for random subset of vehicles/drivers
    const incidentCount = Math.floor(vehicles.length * 0.15); // 15% of vehicles have incidents

    for (let i = 0; i < incidentCount; i++) {
      const vehicle = randomItem(vehicles);
      const driver = drivers.find(d => d.user_id === vehicle.assigned_driver_id);
      const type = randomItem(incidentTypes);
      const severity = randomItem(incidentSeverities);
      const city = randomItem(floridaCities);
      const daysBack = randomInt(1, 730);

      await client.query(
        `INSERT INTO safety_incidents (
          tenant_id, incident_number, vehicle_id, driver_id, incident_date,
          incident_type, severity, location, latitude, longitude, description,
          injuries_count, property_damage_cost, vehicle_damage_cost,
          at_fault, reported_to_osha, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
          vehicle.tenant_id,
          generateIncidentNumber(),
          vehicle.id,
          driver?.id,
          daysAgo(daysBack),
          type,
          severity,
          `${city.name}, FL`,
          city.lat + randomFloat(-0.05, 0.05, 6),
          city.lng + randomFloat(-0.05, 0.05, 6),
          `${type} incident - ${severity} severity`,
          severity === 'severe' || severity === 'fatal' ? randomInt(1, 3) : 0,
          randomFloat(500, 25000),
          randomFloat(1000, 50000),
          Math.random() < 0.4,
          severity === 'severe' || severity === 'fatal',
          daysBack > 60 ? 'closed' : randomItem(['open', 'investigating', 'resolved'])
        ]
      );
      counters.safetyIncidents++;
    }

    console.log(`   ✅ Created ${counters.safetyIncidents} safety incidents`);

    // ========================================
    // 14. TELEMETRY DATA - Realistic GPS/Sensor Data
    // ========================================
    console.log('📡 Creating telemetry data (GPS, sensors, events)...');

    // Create telemetry for active vehicles with GPS
    const telemetryVehicles = vehicles.filter(v => v.status === 'active' && v.gps_device_id).slice(0, 50);

    for (const vehicle of telemetryVehicles) {
      const pointsPerVehicle = randomInt(50, 150); // Reduced from 100-500 for performance

      for (let i = 0; i < pointsPerVehicle; i++) {
        const daysBack = randomInt(0, 30);
        const hoursBack = randomInt(0, 23);
        const minutesBack = randomInt(0, 59);
        const timestamp = new Date();
        timestamp.setDate(timestamp.getDate() - daysBack);
        timestamp.setHours(timestamp.getHours() - hoursBack);
        timestamp.setMinutes(timestamp.getMinutes() - minutesBack);

        const city = randomItem(floridaCities);
        const speed = randomFloat(0, 75);
        const isMoving = speed > 5;

        await client.query(
          `INSERT INTO telemetry_data (
            tenant_id, vehicle_id, timestamp, latitude, longitude, speed, heading,
            odometer, fuel_level, engine_rpm, coolant_temp, battery_voltage,
            harsh_braking, harsh_acceleration, speeding, idle_time
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
          [
            vehicle.tenant_id,
            vehicle.id,
            timestamp,
            city.lat + randomFloat(-0.2, 0.2, 6),
            city.lng + randomFloat(-0.2, 0.2, 6),
            speed,
            randomInt(0, 359),
            vehicle.odometer - randomInt(0, 1000),
            randomFloat(10, 100),
            isMoving ? randomInt(1000, 3500) : randomInt(600, 900),
            randomFloat(170, 220),
            randomFloat(12.0, 14.5),
            Math.random() < 0.02, // 2% harsh braking
            Math.random() < 0.02, // 2% harsh acceleration
            speed > 75 && Math.random() < 0.05, // 5% speeding when going fast
            !isMoving ? randomInt(0, 600) : 0
          ]
        );
        counters.telemetryData++;
      }
    }

    console.log(`   ✅ Created ${counters.telemetryData} telemetry data points`);

    // ========================================
    // 15. VENDORS & PURCHASE ORDERS
    // ========================================
    console.log('🏪 Creating vendors and purchase orders...');

    for (const tenant of tenants) {
      const vendorCount = tenant.tier === 'enterprise' ? 20 : tenant.tier === 'professional' ? 10 : 5;

      for (let i = 0; i < vendorCount; i++) {
        const types = ['parts_supplier', 'fuel_provider', 'service_provider'];
        const vendorType = randomItem(types);
        const city = randomItem(floridaCities);

        const vendor = await client.query(
          `INSERT INTO vendors (
            tenant_id, vendor_name, vendor_type, contact_name, contact_email,
            contact_phone, address, city, state, zip_code, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *`,
          [
            tenant.id,
            `${city.name} ${vendorType.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Co.`,
            vendorType,
            `Contact ${randomInt(1, 100)}`,
            `contact${i}@vendor${randomInt(1, 1000)}.com`,
            generatePhoneNumber(),
            `${randomInt(100, 9999)} Industrial Pkwy`,
            city.name,
            'FL',
            `${randomInt(30000, 34999)}`,
            Math.random() < 0.95
          ]
        );
        counters.vendors++;

        // Create purchase orders for each vendor
        const poCount = randomInt(2, 10);
        for (let j = 0; j < poCount; j++) {
          const statuses = ['draft', 'submitted', 'approved', 'ordered', 'received', 'cancelled'];
          const status = randomItem(statuses);
          const orderDate = daysAgo(randomInt(1, 365));
          const subtotal = randomFloat(500, 25000);
          const tax = subtotal * 0.07;
          const shipping = randomFloat(50, 500);

          await client.query(
            `INSERT INTO purchase_orders (
              tenant_id, po_number, vendor_id, order_date, status,
              subtotal, tax, shipping, line_items
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              tenant.id,
              `PO-${new Date().getFullYear()}-${randomInt(10000, 99999)}`,
              vendor.rows[0].id,
              orderDate,
              status,
              subtotal,
              tax,
              shipping,
              JSON.stringify([
                { part_number: `PART${randomInt(1000, 9999)}`, description: 'Brake pads', quantity: randomInt(1, 10), unit_price: randomFloat(50, 500) }
              ])
            ]
          );
          counters.purchaseOrders++;
        }
      }
    }

    console.log(`   ✅ Created ${counters.vendors} vendors and ${counters.purchaseOrders} purchase orders`);

    // ========================================
    // 16. NOTIFICATIONS - 1000+ alerts
    // ========================================
    console.log('🔔 Creating notifications (all types and priorities)...');

    const notificationTypes = ['alert', 'reminder', 'info'];
    const notificationPriorities = ['low', 'normal', 'high', 'urgent'];
    const notificationTemplates = [
      { type: 'alert', title: 'Maintenance Due', message: 'Vehicle {{vehicle}} has maintenance due soon', priority: 'high' },
      { type: 'alert', title: 'License Expiring', message: 'Driver license expiring in 30 days', priority: 'normal' },
      { type: 'alert', title: 'Low Fuel', message: 'Vehicle {{vehicle}} has low fuel', priority: 'normal' },
      { type: 'alert', title: 'Speeding Detected', message: 'Speeding alert for vehicle {{vehicle}}', priority: 'high' },
      { type: 'alert', title: 'Geofence Violation', message: 'Vehicle entered restricted area', priority: 'urgent' },
      { type: 'reminder', title: 'Route Starting Soon', message: 'Route scheduled to start in 1 hour', priority: 'normal' },
      { type: 'reminder', title: 'Inspection Due', message: 'Pre-trip inspection required', priority: 'normal' },
      { type: 'info', title: 'Route Completed', message: 'Route {{route}} completed successfully', priority: 'low' },
      { type: 'info', title: 'Work Order Assigned', message: 'New work order assigned', priority: 'normal' }
    ];

    for (const user of users.filter(u => u.role !== 'viewer')) {
      const notifCount = randomInt(10, 50);

      for (let i = 0; i < notifCount; i++) {
        const template = randomItem(notificationTemplates);
        const daysBack = randomInt(0, 90);
        const isRead = daysBack > 7 ? Math.random() < 0.8 : Math.random() < 0.3;

        await client.query(
          `INSERT INTO notifications (
            tenant_id, user_id, notification_type, title, message,
            priority, is_read, read_at, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            user.tenant_id,
            user.id,
            template.type,
            template.title,
            template.message,
            template.priority,
            isRead,
            isRead ? daysAgo(daysBack - randomInt(0, 3)) : null,
            daysAgo(daysBack)
          ]
        );
        counters.notifications++;
      }
    }

    console.log(`   ✅ Created ${counters.notifications} notifications`);

    // ========================================
    // 17. AUDIT LOGS - Sample of key actions
    // ========================================
    console.log('📜 Creating audit logs...');

    const auditActions = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'];
    const resourceTypes = ['vehicles', 'work_orders', 'routes', 'drivers', 'fuel_transactions'];

    for (let i = 0; i < 1000; i++) {
      const user = randomItem(users.filter(u => u.is_active));
      const action = randomItem(auditActions);
      const resourceType = randomItem(resourceTypes);

      await client.query(
        `INSERT INTO audit_logs (
          tenant_id, user_id, action, resource_type, outcome, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          user.tenant_id,
          user.id,
          action,
          resourceType,
          Math.random() < 0.98 ? 'success' : 'failure',
          daysAgo(randomInt(0, 90))
        ]
      );
      counters.auditLogs++;
    }

    console.log(`   ✅ Created ${counters.auditLogs} audit logs`);

    await client.query('COMMIT');

    // Calculate total records
    totalRecords = Object.values(counters).reduce((sum, count) => sum + count, 0);

    // ========================================
    // COMPLETION SUMMARY
    // ========================================
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  SEED DATA CREATION COMPLETE - COMPREHENSIVE COVERAGE        ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    console.log('📊 DETAILED SUMMARY:\n');
    console.log('┌─────────────────────────────┬──────────┐');
    console.log('│ Entity Type                 │ Count    │');
    console.log('├─────────────────────────────┼──────────┤');
    console.log(`│ Tenants                     │ ${String(counters.tenants).padStart(8)} │`);
    console.log(`│ Users (All Roles)           │ ${String(counters.users).padStart(8)} │`);
    console.log(`│ Drivers (All Statuses)      │ ${String(counters.drivers).padStart(8)} │`);
    console.log(`│ Vehicles (All Types)        │ ${String(counters.vehicles).padStart(8)} │`);
    console.log(`│ Facilities                  │ ${String(counters.facilities).padStart(8)} │`);
    console.log(`│ Fuel Transactions           │ ${String(counters.fuelTransactions).padStart(8)} │`);
    console.log(`│ Charging Stations           │ ${String(counters.chargingStations).padStart(8)} │`);
    console.log(`│ Charging Sessions           │ ${String(counters.chargingSessions).padStart(8)} │`);
    console.log(`│ Work Orders                 │ ${String(counters.workOrders).padStart(8)} │`);
    console.log(`│ Maintenance Schedules       │ ${String(counters.maintenanceSchedules).padStart(8)} │`);
    console.log(`│ Routes                      │ ${String(counters.routes).padStart(8)} │`);
    console.log(`│ Geofences                   │ ${String(counters.geofences).padStart(8)} │`);
    console.log(`│ Inspections                 │ ${String(counters.inspections).padStart(8)} │`);
    console.log(`│ Safety Incidents            │ ${String(counters.safetyIncidents).padStart(8)} │`);
    console.log(`│ Telemetry Data Points       │ ${String(counters.telemetryData).padStart(8)} │`);
    console.log(`│ Vendors                     │ ${String(counters.vendors).padStart(8)} │`);
    console.log(`│ Purchase Orders             │ ${String(counters.purchaseOrders).padStart(8)} │`);
    console.log(`│ Notifications               │ ${String(counters.notifications).padStart(8)} │`);
    console.log(`│ Audit Logs                  │ ${String(counters.auditLogs).padStart(8)} │`);
    console.log('├─────────────────────────────┼──────────┤');
    console.log(`│ TOTAL RECORDS               │ ${String(totalRecords).padStart(8)} │`);
    console.log('└─────────────────────────────┴──────────┘\n');

    console.log('🎯 COVERAGE VERIFICATION:\n');
    console.log('✅ Tenants: 5 scenarios (Small/Medium/Enterprise/Demo/Inactive)');
    console.log('✅ User Roles: admin, fleet_manager, driver, technician, viewer');
    console.log('✅ User States: active, inactive, suspended, new (24h), long-inactive (6mo+)');
    console.log('✅ Driver Statuses: active, on_leave, suspended, terminated');
    console.log('✅ Driver Licenses: CDL A/B/C, various endorsements, expired/expiring');
    console.log('✅ Vehicle Types: Sedans, SUVs, Pickups, Vans, Box Trucks, Semi-Trucks, Specialty');
    console.log('✅ Vehicle Statuses: active, maintenance, out_of_service, sold, retired');
    console.log('✅ Vehicle Ages: 2015-2025 (10 year range)');
    console.log('✅ Fuel Types: Gasoline, Diesel, Electric, Hybrid, CNG, Propane');
    console.log('✅ Maintenance: 70+ service types, all statuses, overdue/current/future');
    console.log('✅ Work Orders: all types, priorities, statuses');
    console.log('✅ Routes: planned, in_progress, completed, cancelled');
    console.log('✅ Inspections: all types (pre-trip, post-trip, DOT, state, safety)');
    console.log('✅ Incidents: all types and severities');
    console.log('✅ Telemetry: GPS, speed, fuel, harsh events, idle time');
    console.log('✅ Time Range: 2 years of historical data');
    console.log('\n📝 Test Credentials:');
    console.log('   Small Fleet:      admin@small-fleet.local');
    console.log('   Medium Logistics: admin@medium-logistics.local');
    console.log('   Enterprise:       admin@enterprise-fleet.local');
    console.log('   Demo Account:     admin@demo-showcase.local');
    console.log('   Password:         TestPassword123!');
    console.log('\n' + '═'.repeat(64) + '\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the seed
seedDatabase()
  .then(() => {
    console.log('✅ Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
