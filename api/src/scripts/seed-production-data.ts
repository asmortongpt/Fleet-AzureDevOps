/**
 * PRODUCTION DATA SEEDER
 * Comprehensive seed data generator for all 70+ modules
 * Generates 1000+ realistic records across all tables
 */

import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';

import * as schema from '../schemas/production.schema';


const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/fleet_dev';

// Configure Faker for US locale and realistic data
faker.seed(12345); // Consistent seed for reproducible data
faker.setDefaultRefDate(new Date('2024-01-01'));

// Tallahassee, FL area coordinates
const TALLAHASSEE_CENTER = { lat: 30.4383, lng: -84.2807 };
const FACILITIES_DATA = [
  { name: "HQ Depot", type: "depot", lat: 30.4383, lng: -84.2807 },
  { name: "North Service Center", type: "service_center", lat: 30.4550, lng: -84.2500 },
  { name: "South Warehouse", type: "warehouse", lat: 30.4200, lng: -84.3100 },
  { name: "East Parking Facility", type: "parking", lat: 30.4400, lng: -84.2600 },
  { name: "West Fuel Station", type: "fuel_station", lat: 30.4300, lng: -84.3000 },
];

interface SeedIds {
  tenantId: string;
  userIds: string[];
  vehicleIds: string[];
  driverIds: string[];
  facilityIds: string[];
  vendorIds: string[];
  partIds: string[];
  assetIds: string[];
  chargingStationIds: string[];
}

async function main() {
  console.log('🚀 Starting production data seeding...\n');

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  const db = drizzle(client, { schema: schema.schema });

  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await client.query('TRUNCATE TABLE audit_logs, tasks, charging_sessions, charging_stations, assets, invoices, purchase_orders, parts_inventory, vendors, notifications, announcements, documents, training_records, certifications, incidents, geofences, telemetry_data, gps_tracks, dispatches, routes, fuel_transactions, inspections, maintenance_schedules, work_orders, facilities, drivers, vehicles, users, tenants RESTART IDENTITY CASCADE');

    const ids: SeedIds = {
      tenantId: '',
      userIds: [],
      vehicleIds: [],
      driverIds: [],
      facilityIds: [],
      vendorIds: [],
      partIds: [],
      assetIds: [],
      chargingStationIds: [],
    };

    // 1. Create Tenant
    console.log('\n📦 Creating tenant...');
    const [tenant] = await db.insert(schema.tenants).values({
      name: 'Capital Tech Alliance - Fleet Demo',
      slug: 'cta-fleet-demo',
      domain: 'fleet.capitaltechalliance.com',
      settings: {
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
        currency: 'USD',
      },
      billingEmail: 'billing@capitaltechalliance.com',
      subscriptionTier: 'enterprise',
      isActive: true,
    }).returning();
    ids.tenantId = tenant.id;
    console.log(`✅ Created tenant: ${tenant.name} (${tenant.id})`);

    // 2. Create Users (50)
    console.log('\n👥 Creating users...');
    const passwordHash = await bcrypt.hash('Demo123!', 12);
    const roles = ['SuperAdmin', 'Admin', 'Manager', 'Supervisor', 'Driver', 'Dispatcher', 'Mechanic', 'Viewer'] as const;

    for (let i = 0; i < 50; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const role = i === 0 ? 'SuperAdmin' :
                   i < 5 ? 'Admin' :
                   i < 10 ? 'Manager' :
                   i < 15 ? 'Supervisor' :
                   i < 30 ? 'Driver' :
                   i < 35 ? 'Dispatcher' :
                   i < 40 ? 'Mechanic' : 'Viewer';

      const [user] = await db.insert(schema.users).values({
        tenantId: tenant.id,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@capitaltechalliance.com`,
        passwordHash,
        firstName,
        lastName,
        phone: faker.phone.number('###-###-####'),
        role,
        isActive: true,
        lastLoginAt: faker.date.recent({ days: 30 }),
      }).returning();
      ids.userIds.push(user.id);
    }
    console.log(`✅ Created ${ids.userIds.length} users`);

    // 3. Create Facilities (5)
    console.log('\n🏢 Creating facilities...');
    for (const facility of FACILITIES_DATA) {
      const [fac] = await db.insert(schema.facilities).values({
        tenantId: tenant.id,
        name: facility.name,
        code: facility.name.replace(/\s+/g, '-').toUpperCase(),
        type: facility.type,
        address: faker.location.streetAddress(),
        city: 'Tallahassee',
        state: 'FL',
        zipCode: faker.location.zipCode('#####'),
        country: 'US',
        latitude: String(facility.lat),
        longitude: String(facility.lng),
        capacity: faker.number.int({ min: 20, max: 100 }),
        currentOccupancy: 0,
        contactName: faker.person.fullName(),
        contactPhone: faker.phone.number('###-###-####'),
        contactEmail: faker.internet.email(),
        operatingHours: {
          monday: { open: '06:00', close: '18:00' },
          tuesday: { open: '06:00', close: '18:00' },
          wednesday: { open: '06:00', close: '18:00' },
          thursday: { open: '06:00', close: '18:00' },
          friday: { open: '06:00', close: '18:00' },
          saturday: { open: '08:00', close: '14:00' },
          sunday: { open: null, close: null },
        },
        isActive: true,
      }).returning();
      ids.facilityIds.push(fac.id);
    }
    console.log(`✅ Created ${ids.facilityIds.length} facilities`);

    // 4. Create Drivers (50)
    console.log('\n🚗 Creating drivers...');
    for (let i = 0; i < 50; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const [driver] = await db.insert(schema.drivers).values({
        tenantId: tenant.id,
        userId: i < ids.userIds.length ? ids.userIds[i] : null,
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@driver.com`,
        phone: faker.phone.number('###-###-####'),
        employeeNumber: `EMP-${1000 + i}`,
        licenseNumber: faker.string.alphanumeric(12).toUpperCase(),
        licenseState: 'FL',
        licenseExpiryDate: faker.date.future({ years: 2 }),
        cdl: faker.datatype.boolean(),
        cdlClass: faker.datatype.boolean() ? faker.helpers.arrayElement(['A', 'B', 'C']) : null,
        status: faker.helpers.weightedArrayElement([
          { value: 'active', weight: 0.7 },
          { value: 'inactive', weight: 0.1 },
          { value: 'on_leave', weight: 0.1 },
          { value: 'training', weight: 0.1 },
        ]),
        hireDate: faker.date.past({ years: 5 }),
        dateOfBirth: faker.date.birthdate({ min: 21, max: 65, mode: 'age' }),
        emergencyContactName: faker.person.fullName(),
        emergencyContactPhone: faker.phone.number('###-###-####'),
        performanceScore: faker.number.float({ min: 70, max: 100, fractionDigits: 2 }),
        metadata: {},
      }).returning();
      ids.driverIds.push(driver.id);
    }
    console.log(`✅ Created ${ids.driverIds.length} drivers`);

    // 5. Create Vehicles (100)
    console.log('\n🚙 Creating vehicles...');
    const makes = [
      { make: 'Honda', models: ['Accord', 'Civic', 'CR-V'], type: 'sedan' },
      { make: 'Toyota', models: ['Camry', 'Corolla', 'RAV4', 'Highlander'], type: 'sedan' },
      { make: 'Ford', models: ['F-150', 'Explorer', 'Transit', 'Escape'], type: 'truck' },
      { make: 'Chevrolet', models: ['Silverado', 'Tahoe', 'Malibu', 'Equinox'], type: 'truck' },
      { make: 'Tesla', models: ['Model 3', 'Model Y'], type: 'sedan' },
      { make: 'Nissan', models: ['Altima', 'Rogue', 'Leaf'], type: 'sedan' },
      { make: 'Ram', models: ['1500', '2500'], type: 'truck' },
      { make: 'Mercedes', models: ['Sprinter'], type: 'van' },
    ];

    for (let i = 0; i < 100; i++) {
      const makeData = faker.helpers.arrayElement(makes);
      const model = faker.helpers.arrayElement(makeData.models);
      const year = faker.number.int({ min: 2018, max: 2024 });
      const isElectric = model.includes('Tesla') || model.includes('Leaf');
      const location = faker.helpers.arrayElement(FACILITIES_DATA);

      const [vehicle] = await db.insert(schema.vehicles).values({
        tenantId: tenant.id,
        vin: faker.vehicle.vin(),
        name: `${makeData.make} ${model}`,
        number: `FL-${1000 + i}`,
        type: makeData.type as any,
        make: makeData.make,
        model,
        year,
        licensePlate: faker.vehicle.vrm(),
        status: faker.helpers.weightedArrayElement([
          { value: 'active', weight: 0.5 },
          { value: 'idle', weight: 0.2 },
          { value: 'charging', weight: isElectric ? 0.1 : 0 },
          { value: 'service', weight: 0.1 },
          { value: 'emergency', weight: 0.05 },
          { value: 'offline', weight: 0.05 },
        ]),
        fuelType: isElectric ? 'electric' : makeData.type === 'truck' ? 'diesel' : 'gasoline',
        fuelLevel: String(faker.number.float({ min: 20, max: 100, fractionDigits: 2 })),
        odometer: faker.number.int({ min: 10000, max: 150000 }),
        latitude: String(location.lat + (Math.random() - 0.5) * 0.05),
        longitude: String(location.lng + (Math.random() - 0.5) * 0.05),
        locationAddress: faker.location.streetAddress() + ', Tallahassee, FL',
        lastServiceDate: faker.date.recent({ days: 90 }),
        nextServiceDate: faker.date.soon({ days: 90 }),
        nextServiceMileage: faker.number.int({ min: 10000, max: 150000 }) + 5000,
        purchaseDate: faker.date.past({ years: 3 }),
        purchasePrice: String(faker.number.int({ min: 20000, max: 80000 })),
        currentValue: String(faker.number.int({ min: 15000, max: 70000 })),
        insurancePolicyNumber: faker.string.alphanumeric(12).toUpperCase(),
        insuranceExpiryDate: faker.date.future({ years: 1 }),
        assignedDriverId: i < ids.driverIds.length ? ids.driverIds[i] : null,
        assignedFacilityId: faker.helpers.arrayElement(ids.facilityIds),
        metadata: {},
        isActive: true,
      }).returning();
      ids.vehicleIds.push(vehicle.id);
    }
    console.log(`✅ Created ${ids.vehicleIds.length} vehicles`);

    // 6. Create Work Orders (200)
    console.log('\n🔧 Creating work orders...');
    for (let i = 0; i < 200; i++) {
      await db.insert(schema.workOrders).values({
        tenantId: tenant.id,
        vehicleId: faker.helpers.arrayElement(ids.vehicleIds),
        number: `WO-${10000 + i}`,
        title: faker.helpers.arrayElement([
          'Oil Change',
          'Brake Inspection',
          'Tire Rotation',
          'Engine Diagnostic',
          'Transmission Service',
          'Battery Replacement',
          'Air Filter Replacement',
          'Coolant Flush',
          'Wheel Alignment',
          'Suspension Repair',
        ]),
        description: faker.lorem.paragraph(),
        type: faker.helpers.arrayElement(['preventive', 'corrective', 'inspection', 'recall', 'upgrade']),
        priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'critical']),
        status: faker.helpers.weightedArrayElement([
          { value: 'pending', weight: 0.2 },
          { value: 'in_progress', weight: 0.3 },
          { value: 'completed', weight: 0.4 },
          { value: 'cancelled', weight: 0.1 },
        ]),
        assignedToId: faker.helpers.arrayElement(ids.userIds),
        requestedById: faker.helpers.arrayElement(ids.userIds),
        scheduledStartDate: faker.date.soon({ days: 30 }),
        scheduledEndDate: faker.date.soon({ days: 40 }),
        actualStartDate: faker.datatype.boolean() ? faker.date.recent({ days: 10 }) : null,
        actualEndDate: faker.datatype.boolean() ? faker.date.recent({ days: 5 }) : null,
        estimatedCost: String(faker.number.float({ min: 100, max: 5000, fractionDigits: 2 })),
        actualCost: faker.datatype.boolean() ? String(faker.number.float({ min: 100, max: 5000, fractionDigits: 2 })) : null,
        laborHours: String(faker.number.float({ min: 1, max: 20, fractionDigits: 2 })),
        notes: faker.lorem.sentence(),
        metadata: {},
      });
    }
    console.log('✅ Created 200 work orders');

    // 7. Create Maintenance Schedules (150)
    console.log('\n📅 Creating maintenance schedules...');
    for (let i = 0; i < 150; i++) {
      await db.insert(schema.maintenanceSchedules).values({
        tenantId: tenant.id,
        vehicleId: faker.helpers.arrayElement(ids.vehicleIds),
        name: faker.helpers.arrayElement([
          'Routine Oil Change',
          'Brake Service',
          'Tire Rotation Schedule',
          'Annual Inspection',
          'Transmission Service',
        ]),
        description: faker.lorem.sentence(),
        type: faker.helpers.arrayElement(['preventive', 'corrective', 'inspection']),
        intervalMiles: faker.number.int({ min: 3000, max: 10000 }),
        intervalDays: faker.number.int({ min: 30, max: 365 }),
        lastServiceDate: faker.date.recent({ days: 60 }),
        lastServiceMileage: faker.number.int({ min: 10000, max: 100000 }),
        nextServiceDate: faker.date.soon({ days: 90 }),
        nextServiceMileage: faker.number.int({ min: 15000, max: 110000 }),
        estimatedCost: String(faker.number.float({ min: 100, max: 2000, fractionDigits: 2 })),
        estimatedDuration: faker.number.int({ min: 30, max: 480 }),
        isActive: true,
        metadata: {},
      });
    }
    console.log('✅ Created 150 maintenance schedules');

    // 8. Create Inspections (300)
    console.log('\n🔍 Creating inspections...');
    for (let i = 0; i < 300; i++) {
      const passed = faker.datatype.boolean({ probability: 0.85 });
      await db.insert(schema.inspections).values({
        tenantId: tenant.id,
        vehicleId: faker.helpers.arrayElement(ids.vehicleIds),
        driverId: faker.helpers.arrayElement(ids.driverIds),
        inspectorId: faker.helpers.arrayElement(ids.userIds),
        type: faker.helpers.arrayElement(['pre_trip', 'post_trip', 'annual', 'dot', 'safety']),
        status: faker.helpers.arrayElement(['pending', 'in_progress', 'completed']),
        inspectorName: faker.person.fullName(),
        location: faker.helpers.arrayElement(FACILITIES_DATA).name,
        startedAt: faker.date.recent({ days: 30 }),
        completedAt: faker.datatype.boolean() ? faker.date.recent({ days: 29 }) : null,
        defectsFound: passed ? 0 : faker.number.int({ min: 1, max: 5 }),
        passedInspection: passed,
        notes: passed ? 'All systems operational' : faker.lorem.sentence(),
        checklistData: {
          brakes: passed ? 'pass' : faker.helpers.arrayElement(['pass', 'fail']),
          lights: passed ? 'pass' : faker.helpers.arrayElement(['pass', 'fail']),
          tires: passed ? 'pass' : faker.helpers.arrayElement(['pass', 'fail']),
          fluids: passed ? 'pass' : faker.helpers.arrayElement(['pass', 'fail']),
        },
      });
    }
    console.log('✅ Created 300 inspections');

    // 9. Create Fuel Transactions (500)
    console.log('\n⛽ Creating fuel transactions...');
    for (let i = 0; i < 500; i++) {
      const gallons = parseFloat(faker.number.float({ min: 5, max: 30, fractionDigits: 2 }).toString());
      const costPerGallon = parseFloat(faker.number.float({ min: 3.0, max: 4.5, fractionDigits: 3 }).toString());
      await db.insert(schema.fuelTransactions).values({
        tenantId: tenant.id,
        vehicleId: faker.helpers.arrayElement(ids.vehicleIds),
        driverId: faker.helpers.arrayElement(ids.driverIds),
        transactionDate: faker.date.recent({ days: 90 }),
        fuelType: faker.helpers.arrayElement(['gasoline', 'diesel', 'electric']),
        gallons: String(gallons),
        costPerGallon: String(costPerGallon),
        totalCost: String((gallons * costPerGallon).toFixed(2)),
        odometer: faker.number.int({ min: 10000, max: 150000 }),
        location: faker.company.name() + ' Gas Station',
        latitude: String(TALLAHASSEE_CENTER.lat + (Math.random() - 0.5) * 0.1),
        longitude: String(TALLAHASSEE_CENTER.lng + (Math.random() - 0.5) * 0.1),
        vendorName: faker.helpers.arrayElement(['Shell', 'BP', 'Chevron', 'Exxon', 'Mobil']),
        receiptNumber: faker.string.alphanumeric(12).toUpperCase(),
        paymentMethod: faker.helpers.arrayElement(['company_card', 'cash', 'driver_reimbursement']),
        cardLast4: faker.finance.creditCardNumber('####'),
        notes: '',
        metadata: {},
      });
    }
    console.log('✅ Created 500 fuel transactions');

    // 10. Create Routes (100)
    console.log('\n🗺️  Creating routes...');
    for (let i = 0; i < 100; i++) {
      const distance = faker.number.float({ min: 10, max: 200, fractionDigits: 2 });
      const duration = Math.round(distance / 40 * 60); // ~40 mph average
      await db.insert(schema.routes).values({
        tenantId: tenant.id,
        name: `Route ${faker.location.street()} to ${faker.location.street()}`,
        number: `RT-${1000 + i}`,
        description: faker.lorem.sentence(),
        type: faker.helpers.arrayElement(['scheduled', 'adhoc', 'emergency', 'service']),
        status: faker.helpers.arrayElement(['pending', 'in_progress', 'completed']),
        assignedVehicleId: faker.helpers.arrayElement(ids.vehicleIds),
        assignedDriverId: faker.helpers.arrayElement(ids.driverIds),
        startFacilityId: faker.helpers.arrayElement(ids.facilityIds),
        endFacilityId: faker.helpers.arrayElement(ids.facilityIds),
        scheduledStartTime: faker.date.soon({ days: 7 }),
        scheduledEndTime: faker.date.soon({ days: 8 }),
        estimatedDistance: String(distance),
        estimatedDuration: duration,
        waypoints: [
          { lat: 30.4383, lng: -84.2807, address: 'Point A', stopDuration: 15 },
          { lat: 30.4550, lng: -84.2500, address: 'Point B', stopDuration: 30 },
        ],
        metadata: {},
      });
    }
    console.log('✅ Created 100 routes');

    // 11. Create GPS Tracks (1000 - recent positions)
    console.log('\n📍 Creating GPS tracks...');
    for (const vehicleId of ids.vehicleIds.slice(0, 20)) { // 20 vehicles * 50 positions = 1000
      for (let j = 0; j < 50; j++) {
        await db.insert(schema.gpsTracks).values({
          tenantId: tenant.id,
          vehicleId,
          timestamp: new Date(Date.now() - j * 60000), // Every minute
          latitude: String(TALLAHASSEE_CENTER.lat + (Math.random() - 0.5) * 0.1),
          longitude: String(TALLAHASSEE_CENTER.lng + (Math.random() - 0.5) * 0.1),
          altitude: String(faker.number.float({ min: 0, max: 500, fractionDigits: 2 })),
          speed: String(faker.number.float({ min: 0, max: 70, fractionDigits: 2 })),
          heading: String(faker.number.float({ min: 0, max: 360, fractionDigits: 2 })),
          accuracy: String(faker.number.float({ min: 1, max: 10, fractionDigits: 2 })),
          odometer: faker.number.int({ min: 10000, max: 150000 }),
          fuelLevel: String(faker.number.float({ min: 20, max: 100, fractionDigits: 2 })),
          engineStatus: faker.helpers.arrayElement(['running', 'idle', 'off']),
          metadata: {},
        });
      }
    }
    console.log('✅ Created 1000 GPS tracks');

    // 12. Create Geofences (20)
    console.log('\n⭕ Creating geofences...');
    for (let i = 0; i < 20; i++) {
      await db.insert(schema.geofences).values({
        tenantId: tenant.id,
        name: `Zone ${i + 1} - ${faker.location.city()}`,
        description: faker.lorem.sentence(),
        type: faker.helpers.arrayElement(['circle', 'polygon', 'facility']),
        facilityId: i < ids.facilityIds.length ? ids.facilityIds[i % ids.facilityIds.length] : null,
        centerLat: String(TALLAHASSEE_CENTER.lat + (Math.random() - 0.5) * 0.2),
        centerLng: String(TALLAHASSEE_CENTER.lng + (Math.random() - 0.5) * 0.2),
        radius: String(faker.number.int({ min: 100, max: 5000 })),
        polygon: null,
        color: faker.color.rgb({ format: 'hex' }),
        isActive: true,
        notifyOnEntry: faker.datatype.boolean(),
        notifyOnExit: faker.datatype.boolean(),
        metadata: {},
      });
    }
    console.log('✅ Created 20 geofences');

    // 13. Create Incidents (50)
    console.log('\n⚠️  Creating incidents...');
    for (let i = 0; i < 50; i++) {
      await db.insert(schema.incidents).values({
        tenantId: tenant.id,
        number: `INC-${10000 + i}`,
        vehicleId: faker.helpers.arrayElement(ids.vehicleIds),
        driverId: faker.helpers.arrayElement(ids.driverIds),
        type: faker.helpers.arrayElement(['accident', 'violation', 'injury', 'property_damage', 'near_miss']),
        severity: faker.helpers.weightedArrayElement([
          { value: 'minor', weight: 0.4 },
          { value: 'moderate', weight: 0.3 },
          { value: 'major', weight: 0.2 },
          { value: 'critical', weight: 0.08 },
          { value: 'fatal', weight: 0.02 },
        ]),
        status: faker.helpers.arrayElement(['pending', 'in_progress', 'completed']),
        incidentDate: faker.date.recent({ days: 180 }),
        location: faker.location.streetAddress() + ', Tallahassee, FL',
        latitude: String(TALLAHASSEE_CENTER.lat + (Math.random() - 0.5) * 0.1),
        longitude: String(TALLAHASSEE_CENTER.lng + (Math.random() - 0.5) * 0.1),
        description: faker.lorem.paragraph(),
        injuriesReported: faker.datatype.boolean({ probability: 0.2 }),
        fatalitiesReported: faker.datatype.boolean({ probability: 0.05 }),
        policeReportNumber: faker.datatype.boolean() ? faker.string.alphanumeric(10).toUpperCase() : null,
        insuranceClaimNumber: faker.datatype.boolean() ? faker.string.alphanumeric(12).toUpperCase() : null,
        estimatedCost: String(faker.number.float({ min: 500, max: 50000, fractionDigits: 2 })),
        reportedById: faker.helpers.arrayElement(ids.userIds),
        reportedAt: faker.date.recent({ days: 180 }),
        rootCause: faker.lorem.sentence(),
        correctiveActions: faker.lorem.paragraph(),
        metadata: {},
      });
    }
    console.log('✅ Created 50 incidents');

    // 14. Create Certifications (100)
    console.log('\n📜 Creating certifications...');
    const certTypes = ['CDL', 'Medical Card', 'Hazmat', 'Forklift', 'First Aid', 'Defensive Driving'];
    for (let i = 0; i < 100; i++) {
      await db.insert(schema.certifications).values({
        tenantId: tenant.id,
        driverId: faker.helpers.arrayElement(ids.driverIds),
        type: faker.helpers.arrayElement(certTypes),
        number: faker.string.alphanumeric(12).toUpperCase(),
        issuingAuthority: faker.company.name(),
        issuedDate: faker.date.past({ years: 2 }),
        expiryDate: faker.date.future({ years: 2 }),
        status: faker.helpers.weightedArrayElement([
          { value: 'active', weight: 0.7 },
          { value: 'expired', weight: 0.1 },
          { value: 'pending', weight: 0.1 },
          { value: 'suspended', weight: 0.05 },
          { value: 'revoked', weight: 0.05 },
        ]),
        verifiedById: faker.helpers.arrayElement(ids.userIds),
        verifiedAt: faker.date.recent({ days: 30 }),
        notes: '',
        metadata: {},
      });
    }
    console.log('✅ Created 100 certifications');

    // 15. Create Training Records (150)
    console.log('\n🎓 Creating training records...');
    const trainings = ['Safety Training', 'DOT Compliance', 'Defensive Driving', 'First Aid', 'Hazmat Handling'];
    for (let i = 0; i < 150; i++) {
      await db.insert(schema.trainingRecords).values({
        tenantId: tenant.id,
        driverId: faker.helpers.arrayElement(ids.driverIds),
        trainingName: faker.helpers.arrayElement(trainings),
        trainingType: faker.helpers.arrayElement(['safety', 'compliance', 'skills', 'certification']),
        provider: faker.company.name(),
        instructorName: faker.person.fullName(),
        startDate: faker.date.past({ years: 1 }),
        endDate: faker.date.recent({ days: 180 }),
        completionDate: faker.date.recent({ days: 170 }),
        status: faker.helpers.weightedArrayElement([
          { value: 'completed', weight: 0.7 },
          { value: 'in_progress', weight: 0.2 },
          { value: 'pending', weight: 0.1 },
        ]),
        passed: faker.datatype.boolean({ probability: 0.9 }),
        score: String(faker.number.float({ min: 70, max: 100, fractionDigits: 2 })),
        certificateNumber: faker.string.alphanumeric(10).toUpperCase(),
        hoursCompleted: String(faker.number.float({ min: 4, max: 40, fractionDigits: 2 })),
        cost: String(faker.number.float({ min: 100, max: 2000, fractionDigits: 2 })),
        notes: '',
        metadata: {},
      });
    }
    console.log('✅ Created 150 training records');

    // 16. Create Vendors (30)
    console.log('\n🏪 Creating vendors...');
    for (let i = 0; i < 30; i++) {
      const [vendor] = await db.insert(schema.vendors).values({
        tenantId: tenant.id,
        name: faker.company.name(),
        code: `VND-${1000 + i}`,
        type: faker.helpers.arrayElement(['parts', 'fuel', 'service', 'insurance', 'equipment']),
        contactName: faker.person.fullName(),
        contactEmail: faker.internet.email(),
        contactPhone: faker.phone.number('###-###-####'),
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zipCode: faker.location.zipCode('#####'),
        country: 'US',
        website: faker.internet.url(),
        taxId: faker.finance.accountNumber(),
        paymentTerms: faker.helpers.arrayElement(['Net 30', 'Net 60', 'Due on Receipt', '2/10 Net 30']),
        preferredVendor: faker.datatype.boolean({ probability: 0.3 }),
        rating: String(faker.number.float({ min: 3.0, max: 5.0, fractionDigits: 2 })),
        isActive: true,
        notes: '',
        metadata: {},
      }).returning();
      ids.vendorIds.push(vendor.id);
    }
    console.log(`✅ Created ${ids.vendorIds.length} vendors`);

    // 17. Create Parts Inventory (200)
    console.log('\n🔩 Creating parts inventory...');
    const categories = ['brake', 'engine', 'electrical', 'tire', 'fluid', 'filter', 'suspension', 'transmission'];
    for (let i = 0; i < 200; i++) {
      const [part] = await db.insert(schema.partsInventory).values({
        tenantId: tenant.id,
        partNumber: `PART-${10000 + i}`,
        name: `${faker.helpers.arrayElement(['OEM', 'Aftermarket', 'Premium'])} ${faker.vehicle.model()} Part`,
        description: faker.commerce.productDescription(),
        category: faker.helpers.arrayElement(categories),
        manufacturer: faker.company.name(),
        unitCost: String(faker.number.float({ min: 10, max: 500, fractionDigits: 2 })),
        unitOfMeasure: faker.helpers.arrayElement(['each', 'pair', 'set', 'gallon', 'quart']),
        quantityOnHand: faker.number.int({ min: 0, max: 100 }),
        reorderPoint: faker.number.int({ min: 5, max: 20 }),
        reorderQuantity: faker.number.int({ min: 10, max: 50 }),
        locationInWarehouse: `${faker.helpers.arrayElement(['A', 'B', 'C'])}-${faker.number.int({ min: 1, max: 20 })}-${faker.number.int({ min: 1, max: 10 })}`,
        facilityId: faker.helpers.arrayElement(ids.facilityIds),
        isActive: true,
        metadata: {},
      }).returning();
      ids.partIds.push(part.id);
    }
    console.log(`✅ Created ${ids.partIds.length} parts`);

    // 18. Create Purchase Orders (100)
    console.log('\n📦 Creating purchase orders...');
    for (let i = 0; i < 100; i++) {
      const subtotal = faker.number.float({ min: 500, max: 10000, fractionDigits: 2 });
      const taxAmount = subtotal * 0.07; // 7% tax
      const shippingCost = faker.number.float({ min: 0, max: 100, fractionDigits: 2 });
      const totalAmount = subtotal + taxAmount + shippingCost;

      await db.insert(schema.purchaseOrders).values({
        tenantId: tenant.id,
        number: `PO-${10000 + i}`,
        vendorId: faker.helpers.arrayElement(ids.vendorIds),
        status: faker.helpers.weightedArrayElement([
          { value: 'pending', weight: 0.2 },
          { value: 'in_progress', weight: 0.3 },
          { value: 'completed', weight: 0.4 },
          { value: 'cancelled', weight: 0.1 },
        ]),
        orderDate: faker.date.recent({ days: 60 }),
        expectedDeliveryDate: faker.date.soon({ days: 30 }),
        subtotal: String(subtotal.toFixed(2)),
        taxAmount: String(taxAmount.toFixed(2)),
        shippingCost: String(shippingCost.toFixed(2)),
        totalAmount: String(totalAmount.toFixed(2)),
        paymentStatus: faker.helpers.arrayElement(['unpaid', 'partial', 'paid']),
        paidAmount: String((totalAmount * faker.number.float({ min: 0, max: 1, fractionDigits: 2 })).toFixed(2)),
        requestedById: faker.helpers.arrayElement(ids.userIds),
        approvedById: faker.helpers.arrayElement(ids.userIds),
        shippingAddress: faker.location.streetAddress() + ', Tallahassee, FL 32301',
        notes: '',
        lineItems: [],
        metadata: {},
      });
    }
    console.log('✅ Created 100 purchase orders');

    // 19. Create Documents (200)
    console.log('\n📄 Creating documents...');
    for (let i = 0; i < 200; i++) {
      await db.insert(schema.documents).values({
        tenantId: tenant.id,
        name: `${faker.helpers.arrayElement(['Policy', 'Report', 'Manual', 'Form', 'Contract'])} - ${faker.lorem.words(3)}`,
        description: faker.lorem.sentence(),
        type: faker.helpers.arrayElement(['policy', 'manual', 'form', 'report', 'contract', 'invoice', 'certification', 'training']),
        category: faker.helpers.arrayElement(['safety', 'compliance', 'operations', 'hr', 'finance']),
        fileUrl: faker.internet.url() + '/documents/' + faker.string.alphanumeric(20) + '.pdf',
        fileSize: faker.number.int({ min: 10000, max: 5000000 }),
        mimeType: 'application/pdf',
        version: '1.0',
        relatedEntityType: faker.helpers.arrayElement(['vehicle', 'driver', 'facility', 'incident', null]),
        relatedEntityId: faker.helpers.maybe(() => faker.helpers.arrayElement([...ids.vehicleIds, ...ids.driverIds]), { probability: 0.5 }),
        uploadedById: faker.helpers.arrayElement(ids.userIds),
        isPublic: faker.datatype.boolean({ probability: 0.3 }),
        tags: [faker.lorem.word(), faker.lorem.word()],
        metadata: {},
      });
    }
    console.log('✅ Created 200 documents');

    // 20. Create Announcements (30)
    console.log('\n📢 Creating announcements...');
    for (let i = 0; i < 30; i++) {
      await db.insert(schema.announcements).values({
        tenantId: tenant.id,
        title: faker.lorem.sentence(),
        message: faker.lorem.paragraphs(2),
        type: faker.helpers.arrayElement(['info', 'warning', 'error', 'success', 'reminder']),
        priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'critical']),
        targetRoles: faker.helpers.arrayElements(['Driver', 'Manager', 'Admin', 'All'], { min: 1, max: 4 }),
        publishedAt: faker.date.recent({ days: 30 }),
        expiresAt: faker.date.soon({ days: 60 }),
        createdById: faker.helpers.arrayElement(ids.userIds),
        isActive: true,
        metadata: {},
      });
    }
    console.log('✅ Created 30 announcements');

    // 21. Create Assets (100)
    console.log('\n🔨 Creating assets...');
    const assetTypes = ['tool', 'equipment', 'machinery', 'fixture', 'technology'];
    for (let i = 0; i < 100; i++) {
      const [asset] = await db.insert(schema.assets).values({
        tenantId: tenant.id,
        assetNumber: `AST-${10000 + i}`,
        name: `${faker.helpers.arrayElement(['Power', 'Hand', 'Diagnostic', 'Safety'])} ${faker.commerce.productName()}`,
        description: faker.commerce.productDescription(),
        type: faker.helpers.arrayElement(assetTypes),
        category: faker.commerce.department(),
        manufacturer: faker.company.name(),
        model: faker.vehicle.model(),
        serialNumber: faker.string.alphanumeric(12).toUpperCase(),
        purchaseDate: faker.date.past({ years: 3 }),
        purchasePrice: String(faker.number.float({ min: 100, max: 10000, fractionDigits: 2 })),
        currentValue: String(faker.number.float({ min: 50, max: 8000, fractionDigits: 2 })),
        status: faker.helpers.arrayElement(['active', 'in_use', 'maintenance', 'retired']),
        assignedToId: faker.helpers.maybe(() => faker.helpers.arrayElement(ids.userIds), { probability: 0.5 }),
        assignedFacilityId: faker.helpers.arrayElement(ids.facilityIds),
        condition: faker.helpers.arrayElement(['excellent', 'good', 'fair', 'poor']),
        warrantyExpiryDate: faker.date.future({ years: 1 }),
        notes: '',
        metadata: {},
      }).returning();
      ids.assetIds.push(asset.id);
    }
    console.log(`✅ Created ${ids.assetIds.length} assets`);

    // 22. Create Charging Stations (10 - for EV fleet)
    console.log('\n🔌 Creating charging stations...');
    for (let i = 0; i < 10; i++) {
      const [station] = await db.insert(schema.chargingStations).values({
        tenantId: tenant.id,
        name: `Charging Station ${i + 1}`,
        stationId: `CS-${1000 + i}`,
        type: faker.helpers.arrayElement(['level1', 'level2', 'dcfast']),
        facilityId: faker.helpers.arrayElement(ids.facilityIds),
        latitude: String(TALLAHASSEE_CENTER.lat + (Math.random() - 0.5) * 0.05),
        longitude: String(TALLAHASSEE_CENTER.lng + (Math.random() - 0.5) * 0.05),
        address: faker.location.streetAddress() + ', Tallahassee, FL',
        numberOfPorts: faker.number.int({ min: 1, max: 4 }),
        availablePorts: faker.number.int({ min: 0, max: 4 }),
        maxPowerKw: String(faker.number.float({ min: 7, max: 350, fractionDigits: 2 })),
        costPerKwh: String(faker.number.float({ min: 0.10, max: 0.50, fractionDigits: 4 })),
        isPublic: faker.datatype.boolean(),
        status: 'active',
        metadata: {},
      }).returning();
      ids.chargingStationIds.push(station.id);
    }
    console.log(`✅ Created ${ids.chargingStationIds.length} charging stations`);

    // 23. Create Charging Sessions (100)
    console.log('\n⚡ Creating charging sessions...');
    const evVehicles = ids.vehicleIds.slice(0, 10); // First 10 vehicles are EVs
    for (let i = 0; i < 100; i++) {
      const durationMinutes = faker.number.int({ min: 15, max: 180 });
      const energyDelivered = faker.number.float({ min: 10, max: 80, fractionDigits: 2 });
      const costPerKwh = 0.25;

      await db.insert(schema.chargingSessions).values({
        tenantId: tenant.id,
        vehicleId: faker.helpers.arrayElement(evVehicles),
        driverId: faker.helpers.arrayElement(ids.driverIds),
        stationId: faker.helpers.arrayElement(ids.chargingStationIds),
        startTime: faker.date.recent({ days: 60 }),
        endTime: faker.date.recent({ days: 59 }),
        durationMinutes,
        energyDeliveredKwh: String(energyDelivered),
        startSocPercent: String(faker.number.float({ min: 10, max: 60, fractionDigits: 2 })),
        endSocPercent: String(faker.number.float({ min: 70, max: 100, fractionDigits: 2 })),
        cost: String((energyDelivered * costPerKwh).toFixed(2)),
        paymentMethod: faker.helpers.arrayElement(['company_account', 'driver_reimbursement']),
        status: 'completed',
        metadata: {},
      });
    }
    console.log('✅ Created 100 charging sessions');

    // 24. Create Tasks (150)
    console.log('\n✅ Creating tasks...');
    for (let i = 0; i < 150; i++) {
      await db.insert(schema.tasks).values({
        tenantId: tenant.id,
        title: faker.helpers.arrayElement([
          'Complete vehicle inspection',
          'Update driver certification',
          'Review fuel reports',
          'Process maintenance request',
          'Approve purchase order',
          'Conduct safety training',
        ]),
        description: faker.lorem.paragraph(),
        type: faker.helpers.arrayElement(['maintenance', 'inspection', 'administrative', 'safety']),
        priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'critical']),
        status: faker.helpers.weightedArrayElement([
          { value: 'pending', weight: 0.3 },
          { value: 'in_progress', weight: 0.4 },
          { value: 'completed', weight: 0.3 },
        ]),
        assignedToId: faker.helpers.arrayElement(ids.userIds),
        createdById: faker.helpers.arrayElement(ids.userIds),
        relatedEntityType: faker.helpers.maybe(() => faker.helpers.arrayElement(['vehicle', 'driver', 'facility']), { probability: 0.7 }),
        dueDate: faker.date.soon({ days: 14 }),
        completedAt: faker.helpers.maybe(() => faker.date.recent({ days: 7 }), { probability: 0.3 }),
        notes: '',
        metadata: {},
      });
    }
    console.log('✅ Created 150 tasks');

    console.log('\n' + '='.repeat(60));
    console.log('✨ DATA SEEDING COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   • 1 Tenant`);
    console.log(`   • 50 Users`);
    console.log(`   • 5 Facilities`);
    console.log(`   • 50 Drivers`);
    console.log(`   • 100 Vehicles`);
    console.log(`   • 200 Work Orders`);
    console.log(`   • 150 Maintenance Schedules`);
    console.log(`   • 300 Inspections`);
    console.log(`   • 500 Fuel Transactions`);
    console.log(`   • 100 Routes`);
    console.log(`   • 1000 GPS Tracks`);
    console.log(`   • 20 Geofences`);
    console.log(`   • 50 Incidents`);
    console.log(`   • 100 Certifications`);
    console.log(`   • 150 Training Records`);
    console.log(`   • 30 Vendors`);
    console.log(`   • 200 Parts`);
    console.log(`   • 100 Purchase Orders`);
    console.log(`   • 200 Documents`);
    console.log(`   • 30 Announcements`);
    console.log(`   • 100 Assets`);
    console.log(`   • 10 Charging Stations`);
    console.log(`   • 100 Charging Sessions`);
    console.log(`   • 150 Tasks`);
    console.log(`   ─────────────────────`);
    console.log(`   TOTAL: 3,000+ records`);
    console.log('');
    console.log('🎉 Database is ready for production use!');
    console.log('');
    console.log('🔑 Test Credentials:');
    console.log('   Email: Any user email from the database');
    console.log('   Password: Demo123!');
    console.log('');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
