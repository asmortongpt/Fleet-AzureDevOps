/**
 * Tallahassee Fleet Management - Realistic Test Data Seeder
 *
 * Generates realistic data for a small company in Tallahassee, FL including:
 * - Vehicles with TLH prefix and FL plates
 * - Drivers with FL licenses and Tallahassee addresses
 * - Facilities at real Tallahassee locations
 * - GPS coordinates within Tallahassee city limits
 * - Vehicle images and driver avatars
 * - Maintenance records and routes
 */

import { config } from 'dotenv';
import { Pool } from 'pg';

config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Tallahassee GPS coordinates (city center: 30.4383° N, 84.2807° W)
const TALLAHASSEE_CENTER = { lat: 30.4383, lon: -84.2807 };
const TALLAHASSEE_RADIUS = 0.05; // ~3 miles radius

// Real Tallahassee facility locations
const TALLAHASSEE_FACILITIES = [
  { name: 'City Hall', address: '300 S Adams St', lat: 30.4382, lon: -84.2807, type: 'headquarters' },
  { name: 'Public Works Depot', address: '2820 Municipal Way', lat: 30.4612, lon: -84.2989, type: 'maintenance' },
  { name: 'North Service Center', address: '8000 Blountstown Hwy', lat: 30.5127, lon: -84.3442, type: 'service' },
  { name: 'Southwood Facility', address: '4655 Capital Circle SW', lat: 30.3945, lon: -84.2468, type: 'parking' },
  { name: 'Airport Maintenance', address: '3300 Capital Circle SW', lat: 30.3965, lon: -84.3503, type: 'maintenance' },
];

// Tallahassee streets for realistic routes
const TALLAHASSEE_STREETS = [
  'Tennessee St', 'Monroe St', 'Capital Circle', 'Apalachee Pkwy',
  'Thomasville Rd', 'Mahan Dr', 'Tennessee St', 'Capital Circle SW',
  'W Tharpe St', 'Mission Rd', 'Paul Russell Rd', 'Killearn Center Blvd',
];

// Realistic first/last names
const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'Michael', 'Jennifer', 'William', 'Linda',
  'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah',
  'Christopher', 'Karen', 'Daniel', 'Nancy', 'Matthew', 'Betty', 'Anthony', 'Lisa',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Walker', 'Hall', 'Allen',
];

// Vehicle makes/models common in fleet operations
const FLEET_VEHICLES = [
  { make: 'Ford', model: 'F-150', type: 'Pickup Truck', fuel: 'Gasoline', mpg: 22 },
  { make: 'Ford', model: 'F-250', type: 'Pickup Truck', fuel: 'Diesel', mpg: 18 },
  { make: 'Chevrolet', model: 'Silverado 1500', type: 'Pickup Truck', fuel: 'Gasoline', mpg: 21 },
  { make: 'Ram', model: '1500', type: 'Pickup Truck', fuel: 'Gasoline', mpg: 20 },
  { make: 'Ford', model: 'Transit', type: 'Van', fuel: 'Gasoline', mpg: 16 },
  { make: 'Chevrolet', model: 'Express', type: 'Van', fuel: 'Gasoline', mpg: 15 },
  { make: 'Ford', model: 'Escape', type: 'SUV', fuel: 'Gasoline', mpg: 28 },
  { make: 'Toyota', model: 'Tacoma', type: 'Pickup Truck', fuel: 'Gasoline', mpg: 23 },
  { make: 'Nissan', model: 'Frontier', type: 'Pickup Truck', fuel: 'Gasoline', mpg: 22 },
  { make: 'GMC', model: 'Sierra 1500', type: 'Pickup Truck', fuel: 'Gasoline', mpg: 21 },
];

// Service types
const SERVICE_TYPES = [
  'Oil Change', 'Tire Rotation', 'Brake Service', 'Engine Repair',
  'Transmission Service', 'Battery Replacement', 'Air Filter', 'Inspection',
  'Alignment', 'Coolant Flush', 'Spark Plugs', 'Belts & Hoses',
];

// Helper functions
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(array: T[]): T {
  return array[randomInt(0, array.length - 1)];
}

function randomLatLon() {
  const lat = TALLAHASSEE_CENTER.lat + (Math.random() - 0.5) * 2 * TALLAHASSEE_RADIUS;
  const lon = TALLAHASSEE_CENTER.lon + (Math.random() - 0.5) * 2 * TALLAHASSEE_RADIUS;
  return { lat, lon };
}

function generateVIN(): string {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let vin = '';
  for (let i = 0; i < 17; i++) {
    vin += chars.charAt(randomInt(0, chars.length - 1));
  }
  return vin;
}

function generateFLPlate(): string {
  const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  const nums = '0123456789';
  return `${letters.charAt(randomInt(0, 25))}${letters.charAt(randomInt(0, 25))}${letters.charAt(randomInt(0, 25))}-${nums.charAt(randomInt(0, 9))}${nums.charAt(randomInt(0, 9))}${nums.charAt(randomInt(0, 9))}${nums.charAt(randomInt(0, 9))}`;
}

function generateFLLicense(): string {
  return `L${randomInt(100, 999)}-${randomInt(100, 999)}-${randomInt(10, 99)}-${randomInt(100, 999)}-0`;
}

function generateEmail(firstName: string, lastName: string): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@tallahasseefleet.gov`;
}

function generatePhone(): string {
  return `(850) ${randomInt(200, 999)}-${randomInt(1000, 9999)}`;
}

function generateAddress(): string {
  return `${randomInt(100, 9999)} ${randomElement(TALLAHASSEE_STREETS)}, Tallahassee, FL 32301`;
}

// Date helpers
function randomDateInRange(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedData() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🌴 Starting Tallahassee Fleet Data Seeding...\n');

    // 1. Seed Facilities
    console.log('📍 Seeding facilities...');
    const facilityIds: number[] = [];
    for (const facility of TALLAHASSEE_FACILITIES) {
      const result = await client.query(
        `INSERT INTO facilities (name, address, city, state, zip_code, gps_latitude, gps_longitude, facility_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [facility.name, facility.address, 'Tallahassee', 'FL', '32301', facility.lat, facility.lon, facility.type]
      );
      facilityIds.push(result.rows[0].id);
    }
    console.log(`✅ Created ${facilityIds.length} facilities\n`);

    // 2. Seed Drivers (50 drivers for small company)
    console.log('👤 Seeding drivers...');
    const driverIds: string[] = [];
    for (let i = 1; i <= 50; i++) {
      const firstName = randomElement(FIRST_NAMES);
      const lastName = randomElement(LAST_NAMES);
      const driverId = `TLH-D${String(i).padStart(3, '0')}`;
      const email = generateEmail(firstName, lastName);
      const phone = generatePhone();
      const licenseNumber = generateFLLicense();
      const hireDate = randomDateInRange(new Date('2018-01-01'), new Date('2024-01-01'));
      const licenseExp = new Date(Date.now() + randomInt(30, 730) * 24 * 60 * 60 * 1000); // 1-24 months
      const address = generateAddress();
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${driverId}`;

      await client.query(
        `INSERT INTO drivers (
          driver_id, first_name, last_name, email, phone, license_number, license_state,
          license_expiration, hire_date, status, address, avatar_url, performance_score,
          total_miles_driven, violations_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          driverId, firstName, lastName, email, phone, licenseNumber, 'FL',
          licenseExp, hireDate, randomElement(['active', 'active', 'active', 'on-leave', 'inactive']),
          address, avatarUrl, randomInt(75, 100),
          randomInt(50000, 500000), randomInt(0, 5)
        ]
      );
      driverIds.push(driverId);
    }
    console.log(`✅ Created ${driverIds.length} drivers\n`);

    // 3. Seed Vehicles (75 vehicles)
    console.log('🚚 Seeding vehicles...');
    const vehicleIds: number[] = [];
    for (let i = 1; i <= 75; i++) {
      const vehicle = randomElement(FLEET_VEHICLES);
      const year = randomInt(2018, 2024);
      const unitNumber = `TLH-${String(i).padStart(3, '0')}`;
      const vin = generateVIN();
      const plate = generateFLPlate();
      const { lat, lon } = randomLatLon();
      const mileage = randomInt(10000, 150000);
      const acquisitionDate = new Date(`${year}-01-01`);
      const acquisitionCost = randomInt(25000, 65000);
      const currentValue = Math.floor(acquisitionCost * (1 - (2024 - year) * 0.15)); // 15% depreciation/year
      const driver = randomElement([...driverIds, null, null]); // Some unassigned
      const facility = randomElement(facilityIds);
      const imageUrl = `/images/vehicles/${vehicle.make.toLowerCase()}-${vehicle.model.toLowerCase().replace(' ', '-')}.jpg`;

      const result = await client.query(
        `INSERT INTO vehicles (
          unit_number, make, model, year, vin, license_plate, status, mileage,
          fuel_type, gps_latitude, gps_longitude, assigned_driver, home_facility,
          acquisition_date, acquisition_cost, current_value, vehicle_type, image_url, mpg_rating
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING id`,
        [
          unitNumber, vehicle.make, vehicle.model, year, vin, plate,
          randomElement(['active', 'active', 'active', 'active', 'maintenance', 'inactive']),
          mileage, vehicle.fuel, lat, lon, driver, facility, acquisitionDate,
          acquisitionCost, currentValue, vehicle.type, imageUrl, vehicle.mpg
        ]
      );
      vehicleIds.push(result.rows[0].id);
    }
    console.log(`✅ Created ${vehicleIds.length} vehicles\n`);

    // 4. Seed Maintenance Records (200 records)
    console.log('🔧 Seeding maintenance records...');
    for (let i = 0; i < 200; i++) {
      const vehicleId = randomElement(vehicleIds);
      const serviceType = randomElement(SERVICE_TYPES);
      const serviceDate = randomDateInRange(new Date('2023-01-01'), new Date());
      const cost = randomInt(75, 2500);
      const laborHours = Math.random() * 8;
      const technician = `${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`;
      const facility = randomElement(TALLAHASSEE_FACILITIES);
      const status = randomElement(['completed', 'completed', 'completed', 'in-progress', 'scheduled']);

      await client.query(
        `INSERT INTO maintenance_records (
          vehicle_id, service_type, description, service_date, mileage, cost,
          technician, facility, status, priority, labor_hours
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          vehicleId, serviceType, `${serviceType} performed at ${facility.name}`,
          serviceDate, randomInt(10000, 150000), cost, technician, facility.name,
          status, randomElement(['routine', 'routine', 'urgent', 'emergency']),
          laborHours
        ]
      );
    }
    console.log(`✅ Created 200 maintenance records\n`);

    // 5. Seed Fuel Records (500 entries)
    console.log('⛽ Seeding fuel records...');
    for (let i = 0; i < 500; i++) {
      const vehicleId = randomElement(vehicleIds);
      const fillDate = randomDateInRange(new Date('2024-01-01'), new Date());
      const gallons = Math.random() * 25 + 5; // 5-30 gallons
      const pricePerGallon = Math.random() * 0.5 + 3.2; // $3.20-$3.70/gal
      const totalCost = gallons * pricePerGallon;
      const { lat, lon } = randomLatLon();

      await client.query(
        `INSERT INTO fuel_records (
          vehicle_id, fill_date, gallons, cost_per_gallon, total_cost,
          location, gps_latitude, gps_longitude, odometer
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          vehicleId, fillDate, gallons, pricePerGallon, totalCost,
          randomElement(TALLAHASSEE_STREETS), lat, lon,
          randomInt(10000, 150000)
        ]
      );
    }
    console.log(`✅ Created 500 fuel records\n`);

    // 6. Seed Routes (100 routes)
    console.log('🗺️  Seeding routes...');
    for (let i = 0; i < 100; i++) {
      const vehicleId = randomElement(vehicleIds);
      const routeDate = randomDateInRange(new Date('2024-01-01'), new Date());
      const startLocation = randomLatLon();
      const endLocation = randomLatLon();
      const distance = Math.random() * 50 + 5; // 5-55 miles
      const duration = distance * randomInt(2, 4); // 2-4 minutes per mile

      await client.query(
        `INSERT INTO routes (
          vehicle_id, route_date, start_location, end_location,
          start_latitude, start_longitude, end_latitude, end_longitude,
          distance_miles, duration_minutes, avg_speed, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          vehicleId, routeDate, randomElement(TALLAHASSEE_STREETS), randomElement(TALLAHASSEE_STREETS),
          startLocation.lat, startLocation.lon, endLocation.lat, endLocation.lon,
          distance, duration, distance / (duration / 60),
          randomElement(['completed', 'completed', 'in-progress', 'scheduled'])
        ]
      );
    }
    console.log(`✅ Created 100 routes\n`);

    await client.query('COMMIT');

    console.log('✨ Tallahassee Fleet Data Seeding Complete!\n');
    console.log('Summary:');
    console.log(`  - ${facilityIds.length} facilities`);
    console.log(`  - ${driverIds.length} drivers`);
    console.log(`  - ${vehicleIds.length} vehicles`);
    console.log('  - 200 maintenance records');
    console.log('  - 500 fuel records');
    console.log('  - 100 routes');
    console.log('\n🌴 Welcome to Tallahassee Fleet Management! 🌴\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seeder
seedData().catch(console.error);
