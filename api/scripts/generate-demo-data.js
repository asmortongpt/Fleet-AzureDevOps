#!/usr/bin/env node
/**
 * Comprehensive Demo Data Generator for Fleet Management System
 * Generates realistic data for all tables including predictive maintenance and vendor pricing
 */

const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'fleetdb',
  user: process.env.DB_USER || 'fleetadmin',
  password: process.env.DB_PASSWORD,
});

// Helper to generate random data
const random = {
  int: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  float: (min, max, decimals = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(decimals)),
  bool: () => Math.random() > 0.5,
  item: (arr) => arr[Math.floor(Math.random() * arr.length)],
  date: (daysAgo, daysFuture = 0) => {
    const days = random.int(-daysAgo, daysFuture);
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  },
  dateTime: (daysAgo) => {
    const days = random.int(-daysAgo, 0);
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }
};

// Realistic data pools
const MAKES = ['Ford', 'Chevrolet', 'Ram', 'GMC', 'Toyota', 'Honda', 'Nissan', 'Freightliner', 'International', 'Peterbilt'];
const MODELS = {
  'Ford': ['F-150', 'F-250', 'F-350', 'Transit', 'E-350', 'Ranger'],
  'Chevrolet': ['Silverado 1500', 'Silverado 2500', 'Express', 'Colorado', 'Tahoe'],
  'Ram': ['1500', '2500', '3500', 'ProMaster'],
  'GMC': ['Sierra 1500', 'Sierra 2500', 'Savana', 'Canyon'],
  'Toyota': ['Tacoma', 'Tundra', 'Sienna', 'Highlander'],
  'Honda': ['Ridgeline', 'Pilot', 'Odyssey'],
  'Nissan': ['Frontier', 'Titan', 'NV200'],
  'Freightliner': ['Cascadia', 'M2 106'],
  'International': ['LT Series', 'MV Series'],
  'Peterbilt': ['579', '389']
};

const FUEL_TYPES = ['Gasoline', 'Diesel', 'Electric', 'Hybrid'];
const VEHICLE_TYPES = ['Pickup Truck', 'Van', 'Box Truck', 'Semi Truck', 'SUV', 'Sedan'];
const STATES = ['FL', 'GA', 'AL', 'SC', 'NC', 'TN', 'TX', 'CA', 'NY', 'IL'];
const CITIES = {
  'FL': ['Tallahassee', 'Jacksonville', 'Miami', 'Orlando', 'Tampa'],
  'GA': ['Atlanta', 'Savannah', 'Augusta', 'Columbus'],
  'AL': ['Birmingham', 'Montgomery', 'Mobile'],
  'TX': ['Houston', 'Dallas', 'Austin', 'San Antonio']
};

const FIRST_NAMES = ['John', 'Michael', 'David', 'James', 'Robert', 'William', 'Richard', 'Thomas', 'Maria', 'Jennifer', 'Linda', 'Patricia', 'Susan', 'Jessica', 'Sarah', 'Karen'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor'];

const VENDOR_NAMES = [
  'AutoZone Fleet Services', 'NAPA Auto Parts', "O'Reilly Auto Parts", 'Advance Auto Parts',
  'Penske Truck Leasing', 'Rush Truck Centers', 'TA Truck Service', 'Loves Truck Care',
  'FleetPride', 'TruckPro', 'Alliance Truck Parts', 'Roadranger'
];

const VENDOR_TYPES = ['parts_supplier', 'repair_shop', 'fuel_station', 'tire_shop', 'maintenance_facility'];

const PART_CATEGORIES = ['brakes', 'filters', 'fluids', 'electrical', 'suspension', 'engine', 'transmission', 'tires', 'lighting', 'exhaust'];

const SERVICE_TYPES = [
  'oil_change', 'tire_rotation', 'brake_inspection', 'transmission_service',
  'air_filter_replacement', 'coolant_flush', 'battery_replacement',
  'spark_plug_replacement', 'belt_replacement', 'wheel_alignment'
];

console.log('🚀 Starting Fleet Management Demo Data Generator\n');

async function clearExistingData() {
  console.log('🗑️  Clearing existing demo data...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Clear in reverse dependency order
    const tables = [
      'parts_pricing_history',
      'vendor_performance_metrics',
      'vendor_quote_responses',
      'parts_price_quotes',
      'vendor_parts_catalog',
      'vendor_api_configs',
      'vehicle_inspections',
      'vehicle_assignments',
      'fuel_transactions',
      'work_orders',
      'maintenance_schedules',
      'manufacturer_maintenance_schedules',
      'vehicle_damage',
      'purchase_orders',
      'drivers',
      'vehicles',
      'vendors',
      'policies',
      'notifications',
      'inspection_forms',
      'users',
      'tenants'
    ];

    for (const table of tables) {
      await client.query(`DELETE FROM ${table}`);
      console.log(`   ✓ Cleared ${table}`);
    }

    await client.query('COMMIT');
    console.log('✅ All demo data cleared\n');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error clearing data:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function createTenants() {
  console.log('🏢 Creating tenants...');
  const client = await pool.connect();
  try {
    const result = await client.query(`
      INSERT INTO tenants (name, domain, settings, is_active)
      VALUES
        ('Capital Tech Alliance Fleet', 'cta-fleet.com', '{"timezone": "America/New_York", "currency": "USD"}', true),
        ('Florida State Fleet', 'fl-state-fleet.gov', '{"timezone": "America/New_York", "currency": "USD"}', true)
      RETURNING id, name
    `);
    console.log(`✅ Created ${result.rows.length} tenants\n`);
    return result.rows;
  } finally {
    client.release();
  }
}

async function createUsers(tenantId) {
  console.log('👥 Creating users...');
  const client = await pool.connect();
  try {
    const users = [];
    const roles = ['admin', 'fleet_manager', 'driver', 'technician'];

    for (let i = 0; i < 20; i++) {
      const firstName = random.item(FIRST_NAMES);
      const lastName = random.item(LAST_NAMES);
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
      const role = i < 2 ? 'admin' : i < 5 ? 'fleet_manager' : i < 15 ? 'driver' : 'technician';

      const result = await client.query(`
        INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true)
        RETURNING id, email, role
      `, [tenantId, email, '$2a$10$dummyhash', firstName, lastName, `555-${random.int(100, 999)}-${random.int(1000, 9999)}`, role]);

      users.push(result.rows[0]);
    }

    console.log(`✅ Created ${users.length} users\n`);
    return users;
  } finally {
    client.release();
  }
}

async function createDrivers(tenantId, users) {
  console.log('🚗 Creating drivers...');
  const client = await pool.connect();
  try {
    const drivers = [];
    const driverUsers = users.filter(u => u.role === 'driver');

    for (const user of driverUsers) {
      const result = await client.query(`
        INSERT INTO drivers (
          tenant_id, user_id, license_number, license_state, license_expiration,
          cdl_class, cdl_endorsements, medical_card_expiration, hire_date,
          status, safety_score, total_miles_driven, total_hours_driven,
          incidents_count, violations_count, emergency_contact_name, emergency_contact_phone
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING id
      `, [
        tenantId, user.id,
        `D${random.int(10000000, 99999999)}`,
        random.item(STATES),
        random.date(0, 730), // expires in next 2 years
        random.bool() ? random.item(['A', 'B', 'C']) : null,
        random.bool() ? [random.item(['H', 'N', 'P', 'T', 'X'])] : [],
        random.date(0, 365),
        random.date(1825, 0), // hired up to 5 years ago
        'active',
        random.float(85, 100),
        random.float(5000, 150000),
        random.float(100, 3000),
        random.int(0, 3),
        random.int(0, 2),
        `${random.item(FIRST_NAMES)} ${random.item(LAST_NAMES)}`,
        `555-${random.int(100, 999)}-${random.int(1000, 9999)}`
      ]);

      drivers.push(result.rows[0]);
    }

    console.log(`✅ Created ${drivers.length} drivers\n`);
    return drivers;
  } finally {
    client.release();
  }
}

async function createVehicles(tenantId, driverUsers) {
  console.log('🚙 Creating vehicles...');
  const client = await pool.connect();
  try {
    const vehicles = [];

    for (let i = 0; i < 50; i++) {
      const make = random.item(MAKES);
      const model = random.item(MODELS[make]);
      const year = random.int(2015, 2024);
      const vin = `${random.int(100000000, 999999999)}${random.int(10000000, 99999999)}`.substring(0, 17);
      const fuelType = random.item(FUEL_TYPES);
      const vehicleType = random.item(VEHICLE_TYPES);
      const odometer = random.float(5000, 150000);
      const assignedDriver = random.bool() ? random.item(driverUsers).id : null;

      const result = await client.query(`
        INSERT INTO vehicles (
          tenant_id, vin, make, model, year, license_plate, vehicle_type, fuel_type,
          status, odometer, engine_hours, purchase_date, purchase_price, current_value,
          latitude, longitude, assigned_driver_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING id, vin, make, model, year
      `, [
        tenantId, vin, make, model, year,
        `FL-${random.int(100, 999)}-${String.fromCharCode(65 + random.int(0, 25))}${String.fromCharCode(65 + random.int(0, 25))}${String.fromCharCode(65 + random.int(0, 25))}`,
        vehicleType, fuelType,
        random.item(['active', 'active', 'active', 'maintenance', 'out_of_service']), // mostly active
        odometer,
        odometer / random.int(10, 30), // estimate engine hours
        random.date(1825, 0), // purchased up to 5 years ago
        random.float(25000, 80000),
        random.float(15000, 60000),
        random.float(30.3, 30.6, 6), // Tallahassee area
        random.float(-84.3, -84.2, 6),
        assignedDriver
      ]);

      vehicles.push(result.rows[0]);
    }

    console.log(`✅ Created ${vehicles.length} vehicles\n`);
    return vehicles;
  } finally {
    client.release();
  }
}

async function createVendors(tenantId) {
  console.log('🏪 Creating vendors...');
  const client = await pool.connect();
  try {
    const vendors = [];

    for (const vendorName of VENDOR_NAMES) {
      const state = random.item(STATES);
      const result = await client.query(`
        INSERT INTO vendors (
          tenant_id, vendor_name, vendor_type, contact_name, contact_email,
          contact_phone, address, city, state, zip_code, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
        RETURNING id, vendor_name
      `, [
        tenantId,
        vendorName,
        random.item(VENDOR_TYPES),
        `${random.item(FIRST_NAMES)} ${random.item(LAST_NAMES)}`,
        `contact@${vendorName.toLowerCase().replace(/[^a-z]/g, '')}.com`,
        `555-${random.int(100, 999)}-${random.int(1000, 9999)}`,
        `${random.int(100, 9999)} ${random.item(['Main', 'Commerce', 'Industrial', 'Fleet'])} St`,
        random.item(CITIES[state] || ['City']),
        state,
        `${random.int(10000, 99999)}`
      ]);

      vendors.push(result.rows[0]);
    }

    console.log(`✅ Created ${vendors.length} vendors\n`);
    return vendors;
  } finally {
    client.release();
  }
}

async function createManufacturerSchedules() {
  console.log('📋 Creating manufacturer maintenance schedules...');
  const client = await pool.connect();
  try {
    let count = 0;

    for (const make of MAKES) {
      const models = MODELS[make];
      for (const model of models) {
        // Oil change
        await client.query(`
          INSERT INTO manufacturer_maintenance_schedules (
            make, model, service_type, service_category, interval_miles, interval_months,
            description, estimated_duration_minutes, estimated_cost_min, estimated_cost_max,
            labor_hours, priority
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          make, model, 'oil_change', 'routine', 5000, 6,
          'Regular oil and filter change', 45, 50, 80, 0.75, 'normal'
        ]);

        // Tire rotation
        await client.query(`
          INSERT INTO manufacturer_maintenance_schedules (
            make, model, service_type, service_category, interval_miles, interval_months,
            description, estimated_duration_minutes, estimated_cost_min, estimated_cost_max,
            labor_hours, priority
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          make, model, 'tire_rotation', 'routine', 7500, 6,
          'Rotate tires and check pressure', 30, 25, 50, 0.5, 'normal'
        ]);

        // Brake inspection
        await client.query(`
          INSERT INTO manufacturer_maintenance_schedules (
            make, model, service_type, service_category, interval_miles, interval_months,
            description, estimated_duration_minutes, estimated_cost_min, estimated_cost_max,
            labor_hours, priority
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          make, model, 'brake_inspection', 'preventive', 15000, 12,
          'Inspect brake pads, rotors, and fluid', 60, 75, 150, 1, 'high'
        ]);

        // Transmission service
        await client.query(`
          INSERT INTO manufacturer_maintenance_schedules (
            make, model, service_type, service_category, interval_miles, interval_months,
            description, estimated_duration_minutes, estimated_cost_min, estimated_cost_max,
            labor_hours, priority
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          make, model, 'transmission_service', 'major', 60000, 48,
          'Transmission fluid change and filter replacement', 120, 200, 400, 2, 'high'
        ]);

        count += 4;
      }
    }

    console.log(`✅ Created ${count} manufacturer maintenance schedules\n`);
  } finally {
    client.release();
  }
}

async function createMaintenanceSchedules(vehicles) {
  console.log('📅 Creating vehicle maintenance schedules...');
  const client = await pool.connect();
  try {
    let count = 0;

    for (const vehicle of vehicles) {
      // Get manufacturer schedules for this vehicle
      const schedules = await client.query(`
        SELECT * FROM manufacturer_maintenance_schedules
        WHERE make = $1 AND model = $2
      `, [vehicle.make, vehicle.model]);

      for (const schedule of schedules.rows) {
        // Calculate next service due
        const vehicleData = await client.query(`
          SELECT odometer FROM vehicles WHERE id = $1
        `, [vehicle.id]);

        const currentOdometer = parseFloat(vehicleData.rows[0].odometer);
        const nextServiceOdometer = Math.ceil(currentOdometer / schedule.interval_miles) * schedule.interval_miles + schedule.interval_miles;
        const milesUntilDue = nextServiceOdometer - currentOdometer;
        const avgMilesPerDay = 50; // estimate
        const daysUntilDue = Math.ceil(milesUntilDue / avgMilesPerDay);

        const nextServiceDate = new Date();
        nextServiceDate.setDate(nextServiceDate.getDate() + daysUntilDue);

        await client.query(`
          INSERT INTO maintenance_schedules (
            vehicle_id, schedule_id, service_type, service_category, description,
            interval_miles, interval_months, last_service_date, last_service_odometer,
            next_service_due_date, next_service_due_odometer, predicted_next_service_date,
            confidence_score, estimated_cost, estimated_duration_minutes, is_active,
            miles_until_due, days_until_due
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true, $16, $17)
        `, [
          vehicle.id, schedule.id, schedule.service_type, schedule.service_category,
          schedule.description, schedule.interval_miles, schedule.interval_months,
          random.date(180, 0), // last service within 6 months
          currentOdometer - random.int(1000, 5000), // last service odometer
          nextServiceDate.toISOString().split('T')[0],
          nextServiceOdometer,
          nextServiceDate.toISOString().split('T')[0], // predicted same as calculated for now
          random.float(85, 95), // confidence score
          (parseFloat(schedule.estimated_cost_min) + parseFloat(schedule.estimated_cost_max)) / 2,
          schedule.estimated_duration_minutes,
          milesUntilDue,
          daysUntilDue
        ]);

        count++;
      }
    }

    console.log(`✅ Created ${count} vehicle maintenance schedules\n`);
  } finally {
    client.release();
  }
}

async function createFuelTransactions(tenantId, vehicles, drivers, vendors) {
  console.log('⛽ Creating fuel transactions...');
  const client = await pool.connect();
  try {
    let count = 0;

    const fuelVendors = vendors.filter(v => v.vendor_name.includes('Loves') || v.vendor_name.includes('TA'));

    for (const vehicle of vehicles.slice(0, 30)) { // fuel for 30 vehicles
      const numTransactions = random.int(10, 50); // 10-50 transactions per vehicle
      let currentOdometer = 50000; // starting point

      for (let i = 0; i < numTransactions; i++) {
        const gallons = random.float(10, 30);
        const pricePerGallon = random.float(3.20, 4.50);
        const mpg = random.float(12, 22);
        // Realistic miles since last fill (200-400 miles)
        const milesSinceLastFill = random.float(200, 400);

        currentOdometer += milesSinceLastFill;

        await client.query(`
          INSERT INTO fuel_transactions (
            tenant_id, vehicle_id, driver_id, vendor_id, transaction_date,
            vendor_name, fuel_type, quantity_gallons, price_per_gallon, total_cost,
            odometer, miles_since_last_fill, mpg, cost_per_mile, payment_method,
            is_verified, latitude, longitude
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true, $16, $17)
        `, [
          tenantId, vehicle.id,
          random.bool() ? random.item(drivers).id : null,
          fuelVendors.length > 0 ? random.item(fuelVendors).id : null,
          random.dateTime(365 - (i * 3)), // spread over last year
          fuelVendors.length > 0 ? random.item(fuelVendors).vendor_name : 'Fuel Station',
          'Diesel',
          gallons,
          pricePerGallon,
          gallons * pricePerGallon,
          currentOdometer,
          i > 0 ? milesSinceLastFill : null,
          i > 0 ? mpg : null,
          i > 0 ? (gallons * pricePerGallon) / milesSinceLastFill : null,
          random.item(['fleet_card', 'credit_card']),
          random.float(30.3, 30.6, 6),
          random.float(-84.3, -84.2, 6)
        ]);

        count++;
      }
    }

    console.log(`✅ Created ${count} fuel transactions\n`);
  } finally {
    client.release();
  }
}

async function createVendorPartsCatalog(vendors) {
  console.log('🔧 Creating vendor parts catalog...');
  const client = await pool.connect();
  try {
    let count = 0;

    const partNames = {
      'brakes': ['Brake Pads', 'Brake Rotors', 'Brake Fluid', 'Brake Caliper'],
      'filters': ['Oil Filter', 'Air Filter', 'Fuel Filter', 'Cabin Filter'],
      'fluids': ['Motor Oil 5W-30', 'Transmission Fluid', 'Coolant', 'Power Steering Fluid'],
      'electrical': ['Battery', 'Alternator', 'Starter Motor', 'Spark Plugs'],
      'tires': ['All-Season Tire LT265/70R17', 'All-Terrain Tire', 'Highway Tire', 'Winter Tire']
    };

    for (const vendor of vendors) {
      for (const [category, parts] of Object.entries(partNames)) {
        for (const partName of parts) {
          const partNumber = `${vendor.vendor_name.substring(0, 3).toUpperCase()}-${random.int(10000, 99999)}`;
          const basePrice = random.float(15, 500);

          await client.query(`
            INSERT INTO vendor_parts_catalog (
              vendor_id, part_number, part_name, part_category,
              compatible_makes, compatible_models, list_price, cost_price,
              in_stock, stock_quantity, lead_time_days, part_condition,
              warranty_months, quality_rating, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, $10, 'new', $11, $12, true)
          `, [
            vendor.id, partNumber, partName, category,
            [random.item(MAKES), random.item(MAKES)],
            null,
            basePrice,
            basePrice * 0.7, // cost is 70% of retail
            random.int(5, 100),
            random.int(0, 3),
            random.int(6, 36),
            random.float(3.5, 5.0, 1)
          ]);

          count++;
        }
      }
    }

    console.log(`✅ Created ${count} parts in vendor catalog\n`);
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║   Fleet Management Demo Data Generator                 ║');
    console.log('║   Comprehensive realistic data for all tables          ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    await clearExistingData();

    const tenants = await createTenants();
    const mainTenant = tenants[0].id;

    const users = await createUsers(mainTenant);
    const driverUsers = users.filter(u => u.role === 'driver');
    const drivers = await createDrivers(mainTenant, users);
    const vehicles = await createVehicles(mainTenant, driverUsers);
    const vendors = await createVendors(mainTenant);

    await createManufacturerSchedules();
    await createMaintenanceSchedules(vehicles);
    await createFuelTransactions(mainTenant, vehicles, drivers, vendors);
    await createVendorPartsCatalog(vendors);

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║   ✅ DEMO DATA GENERATION COMPLETE!                   ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log('📊 Summary:');
    console.log(`   • ${tenants.length} Tenants`);
    console.log(`   • ${users.length} Users`);
    console.log(`   • ${drivers.length} Drivers`);
    console.log(`   • ${vehicles.length} Vehicles`);
    console.log(`   • ${vendors.length} Vendors`);
    console.log(`   • ${MAKES.length * 4} Manufacturer Schedules per Make/Model`);
    console.log(`   • ${vehicles.length * 4} Vehicle Maintenance Schedules`);
    console.log('   • ~1000+ Fuel Transactions');
    console.log('   • ~500+ Parts in Vendor Catalog\n');

    await pool.end();
  } catch (error) {
    console.error('\n❌ Error generating demo data:', error);
    process.exit(1);
  }
}

main();
