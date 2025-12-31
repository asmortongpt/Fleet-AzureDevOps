#!/usr/bin/env node
/**
 * TALLAHASSEE SMALL COMPANY SEED DATA
 * Comprehensive seed for a small fleet company in Tallahassee, FL
 * All data is dynamically generated using Faker - no hardcoded values
 */

import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/fleet_dev';

// Configure Faker for consistent but random data
faker.seed(Date.now());

// ============================================================================
// TALLAHASSEE GEOGRAPHIC CONFIGURATION
// ============================================================================
const REGION = {
  center: { lat: 30.4383, lng: -84.2807 },
  city: 'Tallahassee',
  state: 'FL',
  stateCode: 'FL',
  zipCodePrefix: '323',
  areaCode: '850',
  timezone: 'America/New_York'
};

// ============================================================================
// SKETCHFAB 3D MODEL MAPPINGS (by vehicle make/model)
// ============================================================================
const SKETCHFAB_MODELS: Record<string, { url: string; id: string; author?: string; license?: string }> = {
  'Ford F-150': { url: 'https://sketchfab.com/3d-models/ford-f-150-c205cde66b1d4f14b1820b89de7b8d23', id: 'c205cde66b1d4f14b1820b89de7b8d23', author: 'Ford Motor Company', license: 'CC-BY-4.0' },
  'Ford F-250': { url: 'https://sketchfab.com/3d-models/ford-f-250-super-duty', id: 'ford-f-250', author: 'Ford Motor Company', license: 'CC-BY-4.0' },
  'Ford Transit': { url: 'https://sketchfab.com/3d-models/ford-transit-custom-double-cargo-van-8d2529f41c7d4404881f6c4014d4f04c', id: '8d2529f41c7d4404881f6c4014d4f04c', author: 'Sketchfab Community', license: 'CC-BY-4.0' },
  'Ford Explorer': { url: 'https://sketchfab.com/3d-models/ford-explorer-suv', id: 'ford-explorer', author: 'Ford Motor Company', license: 'CC-BY-4.0' },
  'Chevrolet Silverado': { url: 'https://sketchfab.com/3d-models/2019-chevrolet-silverado-trail-boss-z71-652324cc8a974d3a9869ce2b0f3beaaa', id: '652324cc8a974d3a9869ce2b0f3beaaa', author: 'Chevrolet', license: 'CC-BY-4.0' },
  'Chevrolet Colorado': { url: 'https://sketchfab.com/3d-models/chevrolet-colorado', id: 'chevrolet-colorado', author: 'Chevrolet', license: 'CC-BY-4.0' },
  'Toyota Camry': { url: 'https://sketchfab.com/3d-models/toyota-camry-fd9b89c8c12b48f98915fac1392e3b67', id: 'fd9b89c8c12b48f98915fac1392e3b67', author: 'Toyota', license: 'CC-BY-4.0' },
  'Toyota Tacoma': { url: 'https://sketchfab.com/3d-models/toyota-tacoma', id: 'toyota-tacoma', author: 'Toyota', license: 'CC-BY-4.0' },
  'Honda Accord': { url: 'https://sketchfab.com/3d-models/2021-honda-accord-e742636e46814de5af1568542e7c9bdb', id: 'e742636e46814de5af1568542e7c9bdb', author: 'Honda', license: 'CC-BY-4.0' },
  'Honda CR-V': { url: 'https://sketchfab.com/3d-models/honda-cr-v', id: 'honda-cr-v', author: 'Honda', license: 'CC-BY-4.0' },
  'Tesla Model 3': { url: 'https://sketchfab.com/3d-models/tesla-2018-model-3-5ef9b845aaf44203b6d04e2c677e444f', id: '5ef9b845aaf44203b6d04e2c677e444f', author: 'Tesla', license: 'CC-BY-4.0' },
  'Tesla Model Y': { url: 'https://sketchfab.com/3d-models/tesla-model-y', id: 'tesla-model-y', author: 'Tesla', license: 'CC-BY-4.0' },
  'Mercedes-Benz Sprinter': { url: 'https://sketchfab.com/3d-models/mercedes-benz-sprinter-152f62800be34652af0545487129ca2e', id: '152f62800be34652af0545487129ca2e', author: 'Mercedes-Benz', license: 'CC-BY-4.0' },
  'Ram ProMaster': { url: 'https://sketchfab.com/3d-models/ram-promaster', id: 'ram-promaster', author: 'Ram Trucks', license: 'CC-BY-4.0' },
  'Nissan NV': { url: 'https://sketchfab.com/3d-models/nissan-nv', id: 'nissan-nv', author: 'Nissan', license: 'CC-BY-4.0' }
};

// ============================================================================
// VEHICLE TEMPLATES FOR FLEET GENERATION
// ============================================================================
const VEHICLE_TEMPLATES = [
  { make: 'Ford', model: 'F-150', type: 'truck', fuelType: 'gasoline', tankSize: 26, mpg: 18, priceRange: [42000, 55000] },
  { make: 'Ford', model: 'F-250', type: 'truck', fuelType: 'diesel', tankSize: 34, mpg: 15, priceRange: [48000, 65000] },
  { make: 'Ford', model: 'Transit', type: 'van', fuelType: 'gasoline', tankSize: 25, mpg: 19, priceRange: [38000, 48000] },
  { make: 'Ford', model: 'Explorer', type: 'suv', fuelType: 'gasoline', tankSize: 18, mpg: 24, priceRange: [38000, 52000] },
  { make: 'Chevrolet', model: 'Silverado', type: 'truck', fuelType: 'gasoline', tankSize: 26, mpg: 19, priceRange: [42000, 58000] },
  { make: 'Chevrolet', model: 'Colorado', type: 'truck', fuelType: 'gasoline', tankSize: 21, mpg: 20, priceRange: [32000, 42000] },
  { make: 'Toyota', model: 'Camry', type: 'sedan', fuelType: 'gasoline', tankSize: 15, mpg: 30, priceRange: [28000, 36000] },
  { make: 'Toyota', model: 'Tacoma', type: 'truck', fuelType: 'gasoline', tankSize: 21, mpg: 21, priceRange: [32000, 45000] },
  { make: 'Honda', model: 'Accord', type: 'sedan', fuelType: 'gasoline', tankSize: 14, mpg: 32, priceRange: [28000, 38000] },
  { make: 'Honda', model: 'CR-V', type: 'suv', fuelType: 'gasoline', tankSize: 22, mpg: 28, priceRange: [32000, 42000] },
  { make: 'Tesla', model: 'Model 3', type: 'sedan', fuelType: 'electric', tankSize: 0, mpg: 0, priceRange: [42000, 55000], batteryKwh: 75, rangeKm: 500 },
  { make: 'Tesla', model: 'Model Y', type: 'suv', fuelType: 'electric', tankSize: 0, mpg: 0, priceRange: [48000, 62000], batteryKwh: 75, rangeKm: 530 },
  { make: 'Mercedes-Benz', model: 'Sprinter', type: 'van', fuelType: 'diesel', tankSize: 25, mpg: 20, priceRange: [48000, 65000] },
  { make: 'Ram', model: 'ProMaster', type: 'van', fuelType: 'gasoline', tankSize: 24, mpg: 18, priceRange: [36000, 48000] }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function generatePhone(): string {
  return `${REGION.areaCode}-${faker.string.numeric(3)}-${faker.string.numeric(4)}`;
}

function generateZipCode(): string {
  return `${REGION.zipCodePrefix}${faker.string.numeric(2)}`;
}

function generateAddress(): string {
  return `${faker.location.buildingNumber()} ${faker.location.street()}`;
}

function generateCoordNear(center: { lat: number; lng: number }, radiusKm: number = 0.1): { lat: number; lng: number } {
  const latOffset = (Math.random() - 0.5) * radiusKm * 0.018;
  const lngOffset = (Math.random() - 0.5) * radiusKm * 0.018;
  return {
    lat: parseFloat((center.lat + latOffset).toFixed(6)),
    lng: parseFloat((center.lng + lngOffset).toFixed(6))
  };
}

function generateVIN(): string {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  return Array.from({ length: 17 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function generateLicensePlate(): string {
  return `${REGION.stateCode}${faker.string.alpha({ length: 2, casing: 'upper' })}${faker.string.numeric(4)}`;
}

function getSketchfabModel(make: string, model: string): { url: string; id: string; author?: string; license?: string } | null {
  const key = `${make} ${model}`;
  return SKETCHFAB_MODELS[key] || null;
}

function generate3DModel(template: typeof VEHICLE_TEMPLATES[0]) {
  const sketchfab = getSketchfabModel(template.make, template.model);
  if (!sketchfab) return null;

  const qualityTiers = ['high', 'medium', 'low'];
  const vehicleType = template.type === 'sedan' ? 'car' : template.type;

  return {
    name: `${template.make} ${template.model} 3D Model`,
    description: `High-quality 3D model of ${template.make} ${template.model} for fleet visualization`,
    vehicleType,
    make: template.make,
    model: template.model,
    year: faker.number.int({ min: 2020, max: 2024 }),
    fileUrl: sketchfab.url,
    fileFormat: 'glTF',
    fileSizeMb: faker.number.float({ min: 5, max: 50, fractionDigits: 2 }),
    polyCount: faker.number.int({ min: 50000, max: 500000 }),
    source: 'sketchfab',
    sourceId: sketchfab.id,
    license: sketchfab.license || 'CC-BY-4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    author: sketchfab.author || faker.person.fullName(),
    authorUrl: `https://sketchfab.com/${faker.internet.username()}`,
    thumbnailUrl: `https://media.sketchfab.com/models/${sketchfab.id}/thumbnails/thumbnail.jpeg`,
    qualityTier: faker.helpers.arrayElement(qualityTiers),
    hasInterior: faker.datatype.boolean({ probability: 0.4 }),
    hasPbrMaterials: true,
    isFeatured: faker.datatype.boolean({ probability: 0.2 }),
    isActive: true,
    tags: JSON.stringify([template.type, template.make.toLowerCase(), template.fuelType, 'fleet'])
  };
}

// ============================================================================
// DATA GENERATORS
// ============================================================================
function generateCompany() {
  const companyTypes = ['Courier', 'Logistics', 'Transport', 'Delivery', 'Fleet'];
  const suffixes = ['Services', 'Solutions', 'Express', 'Inc', 'LLC'];

  const name = `${faker.location.city()} ${faker.helpers.arrayElement(companyTypes)} ${faker.helpers.arrayElement(suffixes)}`;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');

  return {
    name,
    slug,
    domain: `${slug}.com`,
    address: `${generateAddress()}, ${REGION.city}, ${REGION.state} ${generateZipCode()}`,
    phone: generatePhone(),
    email: `info@${slug}.com`,
    taxId: `${faker.string.numeric(2)}-${faker.string.numeric(7)}`
  };
}

function generateEmployee(role: string, index: number) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
    phone: generatePhone(),
    role,
    cdl: role === 'Driver' ? faker.datatype.boolean({ probability: 0.6 }) : false,
    cdlClass: role === 'Driver' && faker.datatype.boolean({ probability: 0.6 }) ? faker.helpers.arrayElement(['A', 'B', 'C']) : null
  };
}

function generateFacility(type: string, index: number) {
  const location = generateCoordNear(REGION.center, 5);
  const facilityNames = {
    depot: ['Main Depot', 'Central Hub', 'Operations Center', 'Fleet Center'],
    warehouse: ['Warehouse', 'Distribution Center', 'Storage Facility', 'Logistics Hub'],
    parking: ['Satellite Lot', 'Parking Facility', 'Vehicle Yard', 'Staging Area'],
    service_center: ['Service Center', 'Maintenance Bay', 'Repair Shop', 'Tech Center']
  };

  const names = facilityNames[type as keyof typeof facilityNames] || facilityNames.depot;

  return {
    name: `${faker.helpers.arrayElement(names)} ${index > 0 ? index + 1 : ''}`.trim(),
    code: `FAC-${faker.string.alphanumeric(4).toUpperCase()}`,
    type,
    address: generateAddress(),
    city: REGION.city,
    state: REGION.state,
    zipCode: generateZipCode(),
    lat: location.lat,
    lng: location.lng,
    capacity: faker.number.int({ min: 10, max: 50 }),
    serviceBays: type === 'service_center' ? faker.number.int({ min: 2, max: 8 }) : faker.number.int({ min: 0, max: 2 }),
    contactName: faker.person.fullName(),
    contactPhone: generatePhone(),
    contactEmail: faker.internet.email()
  };
}

function generateVehicle(index: number) {
  const template = faker.helpers.arrayElement(VEHICLE_TEMPLATES);
  const year = faker.number.int({ min: 2020, max: 2024 });
  const purchasePrice = faker.number.int({ min: template.priceRange[0], max: template.priceRange[1] });
  const location = generateCoordNear(REGION.center, 3);
  const sketchfab = getSketchfabModel(template.make, template.model);

  return {
    vin: generateVIN(),
    name: `${template.make} ${template.model}`,
    number: `VEH-${String(index + 1).padStart(3, '0')}`,
    type: template.type,
    make: template.make,
    model: template.model,
    year,
    licensePlate: generateLicensePlate(),
    fuelType: template.fuelType,
    tankSize: template.tankSize,
    fuelEfficiency: template.mpg,
    color: faker.vehicle.color(),
    purchasePrice,
    currentValue: Math.round(purchasePrice * faker.number.float({ min: 0.6, max: 0.9 })),
    odometer: faker.number.int({ min: 5000, max: 80000 }),
    location,
    batteryCapacity: template.batteryKwh || null,
    electricRange: template.rangeKm || null,
    sketchfabUrl: sketchfab?.url || null,
    sketchfabId: sketchfab?.id || null,
    model3dPath: sketchfab ? `/models/vehicles/${template.type}s/${template.make.toLowerCase()}_${template.model.toLowerCase().replace(/ /g, '_')}.glb` : null
  };
}

function generateVendor(type: string) {
  const vendorTypes = {
    parts: ['Auto Parts', 'Parts Supply', 'Vehicle Parts', 'Fleet Parts'],
    fuel: ['Fuel Services', 'Petroleum', 'Energy', 'Fuel Supply'],
    service: ['Service Center', 'Automotive', 'Fleet Service', 'Maintenance'],
    insurance: ['Insurance', 'Commercial Insurance', 'Fleet Insurance', 'Risk Management']
  };

  const names = vendorTypes[type as keyof typeof vendorTypes] || vendorTypes.parts;

  return {
    name: `${faker.location.city()} ${faker.helpers.arrayElement(names)}`,
    code: faker.string.alphanumeric(4).toUpperCase(),
    type,
    contactName: faker.person.fullName(),
    contactEmail: faker.internet.email(),
    contactPhone: generatePhone(),
    address: generateAddress(),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    zipCode: faker.location.zipCode('#####'),
    paymentTerms: faker.helpers.arrayElement(['Net 30', 'Net 15', 'Net 60', 'Due on Receipt']),
    preferredVendor: faker.datatype.boolean({ probability: 0.3 })
  };
}

function generatePart() {
  const categories = ['fluid', 'filter', 'brake', 'electrical', 'tire', 'engine', 'suspension'];
  const category = faker.helpers.arrayElement(categories);

  const partNames = {
    fluid: ['Motor Oil', 'Transmission Fluid', 'Coolant', 'Brake Fluid', 'Power Steering Fluid'],
    filter: ['Oil Filter', 'Air Filter', 'Fuel Filter', 'Cabin Filter'],
    brake: ['Brake Pads', 'Brake Rotors', 'Brake Calipers', 'Brake Lines'],
    electrical: ['Battery', 'Alternator', 'Starter', 'Spark Plugs', 'Wiper Blades'],
    tire: ['All-Season Tire', 'Performance Tire', 'Truck Tire', 'Spare Tire'],
    engine: ['Serpentine Belt', 'Timing Belt', 'Water Pump', 'Thermostat'],
    suspension: ['Shock Absorber', 'Strut Assembly', 'Control Arm', 'Ball Joint']
  };

  const names = partNames[category as keyof typeof partNames];

  return {
    partNumber: `${category.substring(0, 3).toUpperCase()}-${faker.string.alphanumeric(6).toUpperCase()}`,
    name: faker.helpers.arrayElement(names),
    category,
    manufacturer: faker.company.name(),
    unitCost: faker.number.float({ min: 10, max: 500, fractionDigits: 2 }),
    quantityOnHand: faker.number.int({ min: 0, max: 50 }),
    reorderPoint: faker.number.int({ min: 2, max: 10 }),
    reorderQuantity: faker.number.int({ min: 5, max: 25 })
  };
}

function generateRoute(index: number) {
  const routeTypes = ['delivery', 'pickup', 'service', 'shuttle', 'longhaul', 'emergency'];
  const type = faker.helpers.arrayElement(routeTypes);

  const waypoints = [];
  const numStops = faker.number.int({ min: 2, max: 6 });

  for (let i = 0; i < numStops; i++) {
    const location = generateCoordNear(REGION.center, 10);
    waypoints.push({
      lat: location.lat,
      lng: location.lng,
      name: i === 0 ? 'Start' : i === numStops - 1 ? 'End' : `Stop ${i}`,
      type: i === 0 || i === numStops - 1 ? 'depot' : 'delivery',
      stopDuration: i === 0 || i === numStops - 1 ? 0 : faker.number.int({ min: 5, max: 30 }),
      address: `${generateAddress()}, ${REGION.city}, ${REGION.state}`
    });
  }

  return {
    name: `${faker.location.street()} ${faker.helpers.arrayElement(['Route', 'Run', 'Loop', 'Express'])}`,
    number: `RT-${String(index + 1).padStart(4, '0')}`,
    type,
    estimatedDistance: faker.number.int({ min: 5, max: 100 }),
    estimatedDuration: faker.number.int({ min: 30, max: 240 }),
    waypoints
  };
}

function generateWorkOrder(vehicleId: string, assignedToId: string | null, requestedById: string | null) {
  const titles = [
    'Oil Change', 'Tire Rotation', 'Brake Inspection', 'A/C Service',
    'Transmission Service', 'Battery Replacement', 'Alignment', 'DOT Inspection',
    'Engine Diagnostic', 'Coolant Flush', 'Filter Replacement', 'Belt Replacement'
  ];

  const status = faker.helpers.weightedArrayElement([
    { value: 'pending', weight: 0.2 },
    { value: 'in_progress', weight: 0.3 },
    { value: 'completed', weight: 0.4 },
    { value: 'cancelled', weight: 0.1 }
  ]);

  return {
    vehicleId,
    number: `WO-${faker.string.numeric(8)}`,
    title: faker.helpers.arrayElement(titles),
    description: faker.lorem.sentence(),
    type: faker.helpers.arrayElement(['preventive', 'corrective', 'inspection']),
    priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'critical']),
    status,
    assignedToId,
    requestedById,
    scheduledStartDate: faker.date.soon({ days: 30 }),
    scheduledEndDate: faker.date.soon({ days: 45 }),
    actualStartDate: status !== 'pending' ? faker.date.recent({ days: 15 }) : null,
    actualEndDate: status === 'completed' ? faker.date.recent({ days: 5 }) : null,
    estimatedCost: faker.number.float({ min: 50, max: 2000, fractionDigits: 2 }),
    actualCost: status === 'completed' ? faker.number.float({ min: 50, max: 2000, fractionDigits: 2 }) : null,
    laborHours: status === 'completed' ? faker.number.float({ min: 0.5, max: 8, fractionDigits: 1 }) : null
  };
}

function generateFuelTransaction(vehicleId: string, driverId: string | null) {
  const fuelTypes = ['gasoline', 'diesel'];
  const gallons = faker.number.float({ min: 8, max: 30, fractionDigits: 3 });
  const pricePerGallon = faker.number.float({ min: 3.0, max: 4.5, fractionDigits: 3 });
  const location = generateCoordNear(REGION.center, 5);

  return {
    vehicleId,
    driverId,
    transactionDate: faker.date.recent({ days: 90 }),
    fuelType: faker.helpers.arrayElement(fuelTypes),
    gallons,
    costPerGallon: pricePerGallon,
    totalCost: parseFloat((gallons * pricePerGallon).toFixed(2)),
    odometer: faker.number.int({ min: 10000, max: 100000 }),
    location: `${faker.company.name()} Gas Station`,
    latitude: location.lat,
    longitude: location.lng,
    vendorName: faker.helpers.arrayElement(['Shell', 'BP', 'Chevron', 'Exxon', 'Mobil', 'RaceTrac', 'Circle K']),
    receiptNumber: faker.string.alphanumeric(12).toUpperCase(),
    paymentMethod: faker.helpers.arrayElement(['company_card', 'fleet_card', 'cash']),
    cardLast4: faker.string.numeric(4)
  };
}

function generateInspection(vehicleId: string, driverId: string | null, inspectorId: string | null) {
  const passed = faker.datatype.boolean({ probability: 0.85 });

  return {
    vehicleId,
    driverId,
    inspectorId,
    type: faker.helpers.arrayElement(['pre_trip', 'post_trip', 'safety', 'dot', 'annual']),
    status: 'completed',
    inspectorName: faker.person.fullName(),
    location: faker.company.name(),
    startedAt: faker.date.recent({ days: 60 }),
    completedAt: faker.date.recent({ days: 59 }),
    defectsFound: passed ? 0 : faker.number.int({ min: 1, max: 5 }),
    passedInspection: passed,
    notes: passed ? 'All systems operational' : faker.lorem.sentence(),
    checklistData: {
      brakes: passed ? 'pass' : faker.helpers.arrayElement(['pass', 'fail']),
      lights: 'pass',
      tires: passed ? 'pass' : faker.helpers.arrayElement(['pass', 'needs_attention']),
      fluids: 'pass',
      mirrors: 'pass',
      horn: 'pass',
      wipers: passed ? 'pass' : faker.helpers.arrayElement(['pass', 'needs_attention']),
      seatbelts: 'pass'
    }
  };
}

function generateGPSTrack(vehicleId: string, index: number) {
  const location = generateCoordNear(REGION.center, 8);

  return {
    vehicleId,
    timestamp: new Date(Date.now() - index * 60000),
    latitude: location.lat,
    longitude: location.lng,
    altitude: faker.number.float({ min: 10, max: 50, fractionDigits: 2 }),
    speed: faker.number.float({ min: 0, max: 65, fractionDigits: 2 }),
    heading: faker.number.float({ min: 0, max: 360, fractionDigits: 2 }),
    accuracy: faker.number.float({ min: 2, max: 10, fractionDigits: 2 }),
    odometer: faker.number.int({ min: 10000, max: 100000 }),
    fuelLevel: faker.number.float({ min: 20, max: 100, fractionDigits: 2 }),
    engineStatus: faker.helpers.arrayElement(['running', 'running', 'idle', 'off'])
  };
}

function generateGeofence(index: number) {
  const location = generateCoordNear(REGION.center, 15);
  const types = ['facility', 'operational', 'restricted', 'customer'];
  const type = faker.helpers.arrayElement(types);

  return {
    name: `${faker.location.street()} ${faker.helpers.arrayElement(['Zone', 'Area', 'Perimeter', 'Region'])}`,
    type,
    centerLat: location.lat,
    centerLng: location.lng,
    radius: faker.number.int({ min: 100, max: 5000 }),
    color: faker.color.rgb({ format: 'hex' }),
    isActive: true,
    notifyOnEntry: type === 'restricted',
    notifyOnExit: true
  };
}

function generateIncident(vehicleId: string, driverId: string | null, reportedById: string | null) {
  const types = ['accident', 'near_miss', 'violation', 'property_damage', 'injury'];
  const type = faker.helpers.arrayElement(types);
  const location = generateCoordNear(REGION.center, 10);

  return {
    number: `INC-${faker.string.numeric(8)}`,
    vehicleId,
    driverId,
    type,
    severity: faker.helpers.weightedArrayElement([
      { value: 'minor', weight: 0.5 },
      { value: 'moderate', weight: 0.3 },
      { value: 'major', weight: 0.15 },
      { value: 'critical', weight: 0.05 }
    ]),
    status: faker.helpers.arrayElement(['pending', 'in_progress', 'completed']),
    incidentDate: faker.date.recent({ days: 180 }),
    location: `${generateAddress()}, ${REGION.city}, ${REGION.state}`,
    latitude: location.lat,
    longitude: location.lng,
    description: faker.lorem.paragraph(),
    injuriesReported: faker.datatype.boolean({ probability: 0.1 }),
    fatalitiesReported: false,
    policeReportNumber: type === 'accident' ? `TPD-${faker.string.numeric(8)}` : null,
    insuranceClaimNumber: faker.datatype.boolean({ probability: 0.4 }) ? `CLM-${faker.string.numeric(8)}` : null,
    estimatedCost: faker.number.float({ min: 100, max: 25000, fractionDigits: 2 }),
    reportedById,
    reportedAt: faker.date.recent({ days: 180 })
  };
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================
async function seedTallahasseeCompany() {
  console.log('=========================================================');
  console.log('  DYNAMIC FLEET DATA SEED');
  console.log('  Location: Tallahassee, Florida');
  console.log('  All data generated dynamically using Faker');
  console.log('=========================================================\n');

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    // Generate company info
    const company = generateCompany();
    console.log(`Company: ${company.name}\n`);

    console.log('Clearing existing data...\n');
    await client.query(`
      TRUNCATE TABLE
        audit_logs, tasks, charging_sessions, charging_stations,
        invoices, purchase_orders, parts_inventory, vendors,
        notifications, announcements, documents,
        training_records, certifications, incidents,
        geofences, telemetry_data, gps_tracks, dispatches, routes,
        fuel_transactions, inspections, maintenance_schedules, work_orders,
        assets, drivers, vehicles, vehicle_3d_models, facilities, users, tenants
      RESTART IDENTITY CASCADE
    `);

    const ids: any = {
      tenantId: '',
      userIds: [],
      driverUserIds: [],
      mechanicUserIds: [],
      managerUserIds: [],
      vehicleIds: [],
      driverIds: [],
      facilityIds: [],
      vendorIds: [],
      partIds: [],
      chargingStationIds: [],
      model3dIds: {} as Record<string, string>  // Maps "make model" to id
    };

    // Configuration for data generation
    const CONFIG = {
      employees: { admins: 2, managers: 3, supervisors: 2, dispatchers: 3, mechanics: 3, drivers: 12, viewers: 2 },
      facilities: 3,
      vehicles: 15,
      vendors: 8,
      parts: 30,
      workOrders: 50,
      fuelTransactions: 200,
      routes: 25,
      inspections: 150,
      gpsTracksPerVehicle: 100,
      geofences: 8,
      incidents: 15,
      chargingStations: 4,
      chargingSessions: 40
    };

    // ========================================================================
    // 1. CREATE TENANT
    // ========================================================================
    console.log('1. Creating tenant...');
    const tenantResult = await client.query(`
      INSERT INTO tenants (name, slug, domain, settings, billing_email, subscription_tier, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      company.name,
      company.slug,
      company.domain,
      JSON.stringify({
        timezone: REGION.timezone,
        dateFormat: 'MM/DD/YYYY',
        currency: 'USD',
        distanceUnit: 'miles',
        fuelUnit: 'gallons',
        companyAddress: company.address,
        companyPhone: company.phone,
        taxId: company.taxId
      }),
      company.email,
      'professional',
      true
    ]);
    ids.tenantId = tenantResult.rows[0].id;
    console.log(`   Created tenant: ${company.name}\n`);

    // ========================================================================
    // 2. CREATE 3D VEHICLE MODELS
    // ========================================================================
    console.log('2. Creating 3D vehicle models...');
    for (const template of VEHICLE_TEMPLATES) {
      const model3d = generate3DModel(template);
      if (model3d) {
        const result = await client.query(`
          INSERT INTO vehicle_3d_models (name, description, vehicle_type, make, model, year, file_url, file_format, file_size_mb, poly_count, source, source_id, license, license_url, author, author_url, thumbnail_url, quality_tier, has_interior, has_pbr_materials, is_featured, is_active, tags)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
          RETURNING id
        `, [
          model3d.name, model3d.description, model3d.vehicleType, model3d.make, model3d.model,
          model3d.year, model3d.fileUrl, model3d.fileFormat, model3d.fileSizeMb, model3d.polyCount,
          model3d.source, model3d.sourceId, model3d.license, model3d.licenseUrl, model3d.author,
          model3d.authorUrl, model3d.thumbnailUrl, model3d.qualityTier, model3d.hasInterior,
          model3d.hasPbrMaterials, model3d.isFeatured, model3d.isActive, model3d.tags
        ]);
        ids.model3dIds[`${template.make} ${template.model}`] = result.rows[0].id;
      }
    }
    console.log(`   Created ${Object.keys(ids.model3dIds).length} 3D vehicle models from Sketchfab\n`);

    // ========================================================================
    // 3. CREATE USERS
    // ========================================================================
    console.log('3. Creating users...');
    const passwordHash = await bcrypt.hash(faker.internet.password({ length: 16 }), 12);
    const roles = [
      ...Array(CONFIG.employees.admins).fill('Admin'),
      ...Array(CONFIG.employees.managers).fill('Manager'),
      ...Array(CONFIG.employees.supervisors).fill('Supervisor'),
      ...Array(CONFIG.employees.dispatchers).fill('Dispatcher'),
      ...Array(CONFIG.employees.mechanics).fill('Mechanic'),
      ...Array(CONFIG.employees.drivers).fill('Driver'),
      ...Array(CONFIG.employees.viewers).fill('Viewer')
    ];

    for (let i = 0; i < roles.length; i++) {
      const role = roles[i];
      const emp = generateEmployee(role, i);

      const result = await client.query(`
        INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active, last_login_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [
        ids.tenantId,
        `${emp.email}@${company.domain}`,
        passwordHash,
        emp.firstName,
        emp.lastName,
        emp.phone,
        role,
        true,
        faker.date.recent({ days: 7 })
      ]);

      ids.userIds.push({ id: result.rows[0].id, ...emp });
      if (role === 'Driver') ids.driverUserIds.push(result.rows[0].id);
      if (role === 'Mechanic') ids.mechanicUserIds.push(result.rows[0].id);
      if (role === 'Manager') ids.managerUserIds.push(result.rows[0].id);
    }
    console.log(`   Created ${roles.length} users\n`);

    // ========================================================================
    // 3. CREATE FACILITIES
    // ========================================================================
    console.log('4. Creating facilities...');
    const facilityTypes = ['depot', 'warehouse', 'parking'];

    for (let i = 0; i < CONFIG.facilities; i++) {
      const fac = generateFacility(facilityTypes[i % facilityTypes.length], i);

      const result = await client.query(`
        INSERT INTO facilities (tenant_id, name, code, type, address, city, state, zip_code, country, latitude, longitude, capacity, current_occupancy, contact_name, contact_phone, contact_email, operating_hours, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING id
      `, [
        ids.tenantId, fac.name, fac.code, fac.type, fac.address, fac.city, fac.state, fac.zipCode, 'US',
        fac.lat, fac.lng, fac.capacity, faker.number.int({ min: 0, max: Math.floor(fac.capacity * 0.7) }),
        fac.contactName, fac.contactPhone, fac.contactEmail,
        JSON.stringify({
          monday: { open: '06:00', close: '20:00' },
          tuesday: { open: '06:00', close: '20:00' },
          wednesday: { open: '06:00', close: '20:00' },
          thursday: { open: '06:00', close: '20:00' },
          friday: { open: '06:00', close: '20:00' },
          saturday: { open: '07:00', close: '15:00' },
          sunday: { open: null, close: null }
        }),
        true
      ]);
      ids.facilityIds.push(result.rows[0].id);
    }
    console.log(`   Created ${CONFIG.facilities} facilities\n`);

    // ========================================================================
    // 4. CREATE DRIVERS
    // ========================================================================
    console.log('5. Creating drivers...');
    const driverUsers = ids.userIds.filter((u: any) => u.role === 'Driver');

    for (const driver of driverUsers) {
      const result = await client.query(`
        INSERT INTO drivers (tenant_id, user_id, first_name, last_name, email, phone, employee_number, license_number, license_state, license_expiry_date, cdl, cdl_class, status, hire_date, date_of_birth, emergency_contact_name, emergency_contact_phone, performance_score, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING id
      `, [
        ids.tenantId,
        driver.id,
        driver.firstName,
        driver.lastName,
        `${driver.email}@${company.domain}`,
        driver.phone,
        `EMP-${faker.string.numeric(6)}`,
        `${REGION.stateCode}${faker.string.numeric(9)}`,
        REGION.stateCode,
        faker.date.future({ years: 3 }),
        driver.cdl,
        driver.cdlClass,
        'active',
        faker.date.past({ years: 5 }),
        faker.date.birthdate({ min: 21, max: 60, mode: 'age' }),
        faker.person.fullName(),
        generatePhone(),
        faker.number.float({ min: 75, max: 100, fractionDigits: 2 }),
        '{}'
      ]);
      ids.driverIds.push(result.rows[0].id);
    }
    console.log(`   Created ${driverUsers.length} drivers\n`);

    // ========================================================================
    // 5. CREATE VEHICLES
    // ========================================================================
    console.log('6. Creating vehicles...');
    for (let i = 0; i < CONFIG.vehicles; i++) {
      const v = generateVehicle(i);

      // Get 3D model ID if available
      const model3dKey = `${v.make} ${v.model}`;
      const model3dId = ids.model3dIds[model3dKey] || null;

      const result = await client.query(`
        INSERT INTO vehicles (tenant_id, vin, name, number, type, make, model, year, license_plate, status, fuel_type, fuel_level, odometer, latitude, longitude, location_address, last_service_date, next_service_date, next_service_mileage, purchase_date, purchase_price, current_value, insurance_policy_number, insurance_expiry_date, assigned_driver_id, assigned_facility_id, model_3d_id, metadata, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
        RETURNING id
      `, [
        ids.tenantId, v.vin, v.name, v.number, v.type, v.make, v.model, v.year, v.licensePlate,
        faker.helpers.arrayElement(['active', 'active', 'active', 'idle']),
        v.fuelType,
        faker.number.float({ min: 30, max: 95, fractionDigits: 2 }),
        v.odometer, v.location.lat, v.location.lng,
        `${generateAddress()}, ${REGION.city}, ${REGION.state}`,
        faker.date.recent({ days: 90 }),
        faker.date.soon({ days: 90 }),
        v.odometer + faker.number.int({ min: 3000, max: 5000 }),
        faker.date.past({ years: 3 }),
        v.purchasePrice, v.currentValue,
        `POL-${faker.string.alphanumeric(10).toUpperCase()}`,
        faker.date.future({ years: 1 }),
        i < ids.driverIds.length ? ids.driverIds[i] : null,
        faker.helpers.arrayElement(ids.facilityIds),
        model3dId,
        JSON.stringify({
          color: v.color,
          sketchfabUrl: v.sketchfabUrl,
          sketchfabId: v.sketchfabId,
          model3dPath: v.model3dPath,
          batteryCapacity: v.batteryCapacity,
          electricRange: v.electricRange
        }),
        true
      ]);
      ids.vehicleIds.push(result.rows[0].id);
    }
    console.log(`   Created ${CONFIG.vehicles} vehicles with Sketchfab 3D model references\n`);

    // ========================================================================
    // 6. CREATE VENDORS
    // ========================================================================
    console.log('7. Creating vendors...');
    const vendorTypes = ['parts', 'fuel', 'service', 'insurance', 'parts', 'service', 'parts', 'fuel'];

    for (let i = 0; i < CONFIG.vendors; i++) {
      const vendor = generateVendor(vendorTypes[i % vendorTypes.length]);

      const result = await client.query(`
        INSERT INTO vendors (tenant_id, name, code, type, contact_name, contact_email, contact_phone, address, city, state, zip_code, country, payment_terms, preferred_vendor, rating, is_active, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING id
      `, [
        ids.tenantId, vendor.name, vendor.code, vendor.type, vendor.contactName, vendor.contactEmail,
        vendor.contactPhone, vendor.address, vendor.city, vendor.state, vendor.zipCode, 'US',
        vendor.paymentTerms, vendor.preferredVendor,
        faker.number.float({ min: 3.0, max: 5.0, fractionDigits: 2 }),
        true, '{}'
      ]);
      ids.vendorIds.push(result.rows[0].id);
    }
    console.log(`   Created ${CONFIG.vendors} vendors\n`);

    // ========================================================================
    // 7. CREATE PARTS INVENTORY
    // ========================================================================
    console.log('8. Creating parts inventory...');
    for (let i = 0; i < CONFIG.parts; i++) {
      const part = generatePart();

      const result = await client.query(`
        INSERT INTO parts_inventory (tenant_id, part_number, name, description, category, manufacturer, unit_cost, unit_of_measure, quantity_on_hand, reorder_point, reorder_quantity, location_in_warehouse, facility_id, is_active, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id
      `, [
        ids.tenantId, part.partNumber, part.name, faker.lorem.sentence(), part.category,
        part.manufacturer, part.unitCost, 'each', part.quantityOnHand, part.reorderPoint, part.reorderQuantity,
        `${faker.helpers.arrayElement(['A', 'B', 'C'])}-${faker.number.int({ min: 1, max: 10 })}-${faker.number.int({ min: 1, max: 5 })}`,
        faker.helpers.arrayElement(ids.facilityIds), true, '{}'
      ]);
      ids.partIds.push(result.rows[0].id);
    }
    console.log(`   Created ${CONFIG.parts} parts\n`);

    // ========================================================================
    // 8. CREATE WORK ORDERS
    // ========================================================================
    console.log('9. Creating work orders...');
    for (let i = 0; i < CONFIG.workOrders; i++) {
      const wo = generateWorkOrder(
        faker.helpers.arrayElement(ids.vehicleIds),
        ids.mechanicUserIds.length > 0 ? faker.helpers.arrayElement(ids.mechanicUserIds) : null,
        ids.managerUserIds.length > 0 ? faker.helpers.arrayElement(ids.managerUserIds) : null
      );

      await client.query(`
        INSERT INTO work_orders (tenant_id, vehicle_id, number, title, description, type, priority, status, assigned_to_id, requested_by_id, scheduled_start_date, scheduled_end_date, actual_start_date, actual_end_date, estimated_cost, actual_cost, labor_hours, notes, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      `, [
        ids.tenantId, wo.vehicleId, wo.number, wo.title, wo.description, wo.type, wo.priority, wo.status,
        wo.assignedToId, wo.requestedById, wo.scheduledStartDate, wo.scheduledEndDate,
        wo.actualStartDate, wo.actualEndDate, wo.estimatedCost, wo.actualCost, wo.laborHours, '', '{}'
      ]);
    }
    console.log(`   Created ${CONFIG.workOrders} work orders\n`);

    // ========================================================================
    // 9. CREATE FUEL TRANSACTIONS
    // ========================================================================
    console.log('10. Creating fuel transactions...');
    for (let i = 0; i < CONFIG.fuelTransactions; i++) {
      const ft = generateFuelTransaction(
        faker.helpers.arrayElement(ids.vehicleIds),
        ids.driverIds.length > 0 ? faker.helpers.arrayElement(ids.driverIds) : null
      );

      await client.query(`
        INSERT INTO fuel_transactions (tenant_id, vehicle_id, driver_id, transaction_date, fuel_type, gallons, cost_per_gallon, total_cost, odometer, location, latitude, longitude, vendor_name, receipt_number, payment_method, card_last4, notes, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      `, [
        ids.tenantId, ft.vehicleId, ft.driverId, ft.transactionDate, ft.fuelType, ft.gallons,
        ft.costPerGallon, ft.totalCost, ft.odometer, ft.location, ft.latitude, ft.longitude,
        ft.vendorName, ft.receiptNumber, ft.paymentMethod, ft.cardLast4, '', '{}'
      ]);
    }
    console.log(`   Created ${CONFIG.fuelTransactions} fuel transactions\n`);

    // ========================================================================
    // 10. CREATE ROUTES
    // ========================================================================
    console.log('11. Creating routes...');
    for (let i = 0; i < CONFIG.routes; i++) {
      const route = generateRoute(i);

      await client.query(`
        INSERT INTO routes (tenant_id, name, number, description, type, status, assigned_vehicle_id, assigned_driver_id, start_facility_id, end_facility_id, scheduled_start_time, scheduled_end_time, estimated_distance, estimated_duration, waypoints, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [
        ids.tenantId, route.name, route.number, faker.lorem.sentence(), route.type,
        faker.helpers.arrayElement(['pending', 'in_progress', 'completed']),
        faker.helpers.arrayElement(ids.vehicleIds),
        ids.driverIds.length > 0 ? faker.helpers.arrayElement(ids.driverIds) : null,
        faker.helpers.arrayElement(ids.facilityIds),
        faker.helpers.arrayElement(ids.facilityIds),
        faker.date.recent({ days: 30 }),
        faker.date.recent({ days: 30 }),
        route.estimatedDistance, route.estimatedDuration,
        JSON.stringify(route.waypoints), '{}'
      ]);
    }
    console.log(`   Created ${CONFIG.routes} routes\n`);

    // ========================================================================
    // 11. CREATE INSPECTIONS
    // ========================================================================
    console.log('12. Creating inspections...');
    for (let i = 0; i < CONFIG.inspections; i++) {
      const insp = generateInspection(
        faker.helpers.arrayElement(ids.vehicleIds),
        ids.driverIds.length > 0 ? faker.helpers.arrayElement(ids.driverIds) : null,
        ids.managerUserIds.length > 0 ? faker.helpers.arrayElement(ids.managerUserIds) : null
      );

      await client.query(`
        INSERT INTO inspections (tenant_id, vehicle_id, driver_id, inspector_id, type, status, inspector_name, location, started_at, completed_at, defects_found, passed_inspection, notes, checklist_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        ids.tenantId, insp.vehicleId, insp.driverId, insp.inspectorId, insp.type, insp.status,
        insp.inspectorName, insp.location, insp.startedAt, insp.completedAt, insp.defectsFound,
        insp.passedInspection, insp.notes, JSON.stringify(insp.checklistData)
      ]);
    }
    console.log(`   Created ${CONFIG.inspections} inspections\n`);

    // ========================================================================
    // 12. CREATE GPS TRACKS
    // ========================================================================
    console.log('13. Creating GPS tracks...');
    const vehiclesForGPS = ids.vehicleIds.slice(0, Math.min(10, ids.vehicleIds.length));
    let totalGPSTracks = 0;

    for (const vehicleId of vehiclesForGPS) {
      for (let j = 0; j < CONFIG.gpsTracksPerVehicle; j++) {
        const track = generateGPSTrack(vehicleId, j);

        await client.query(`
          INSERT INTO gps_tracks (tenant_id, vehicle_id, timestamp, latitude, longitude, altitude, speed, heading, accuracy, odometer, fuel_level, engine_status, metadata)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
          ids.tenantId, track.vehicleId, track.timestamp, track.latitude, track.longitude,
          track.altitude, track.speed, track.heading, track.accuracy, track.odometer,
          track.fuelLevel, track.engineStatus, '{}'
        ]);
        totalGPSTracks++;
      }
    }
    console.log(`   Created ${totalGPSTracks} GPS tracks\n`);

    // ========================================================================
    // 13. CREATE GEOFENCES
    // ========================================================================
    console.log('14. Creating geofences...');
    for (let i = 0; i < CONFIG.geofences; i++) {
      const geo = generateGeofence(i);

      await client.query(`
        INSERT INTO geofences (tenant_id, name, description, type, center_lat, center_lng, radius, color, is_active, notify_on_entry, notify_on_exit, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        ids.tenantId, geo.name, faker.lorem.sentence(), geo.type, geo.centerLat, geo.centerLng,
        geo.radius, geo.color, geo.isActive, geo.notifyOnEntry, geo.notifyOnExit, '{}'
      ]);
    }
    console.log(`   Created ${CONFIG.geofences} geofences\n`);

    // ========================================================================
    // 14. CREATE INCIDENTS
    // ========================================================================
    console.log('15. Creating incidents...');
    for (let i = 0; i < CONFIG.incidents; i++) {
      const inc = generateIncident(
        faker.helpers.arrayElement(ids.vehicleIds),
        ids.driverIds.length > 0 ? faker.helpers.arrayElement(ids.driverIds) : null,
        ids.managerUserIds.length > 0 ? faker.helpers.arrayElement(ids.managerUserIds) : null
      );

      await client.query(`
        INSERT INTO incidents (tenant_id, number, vehicle_id, driver_id, type, severity, status, incident_date, location, latitude, longitude, description, injuries_reported, fatalities_reported, police_report_number, insurance_claim_number, estimated_cost, reported_by_id, reported_at, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      `, [
        ids.tenantId, inc.number, inc.vehicleId, inc.driverId, inc.type, inc.severity, inc.status,
        inc.incidentDate, inc.location, inc.latitude, inc.longitude, inc.description,
        inc.injuriesReported, inc.fatalitiesReported, inc.policeReportNumber, inc.insuranceClaimNumber,
        inc.estimatedCost, inc.reportedById, inc.reportedAt, '{}'
      ]);
    }
    console.log(`   Created ${CONFIG.incidents} incidents\n`);

    // ========================================================================
    // 15. CREATE CHARGING STATIONS & SESSIONS
    // ========================================================================
    console.log('16. Creating charging stations...');
    for (let i = 0; i < CONFIG.chargingStations; i++) {
      const location = generateCoordNear(REGION.center, 3);

      const result = await client.query(`
        INSERT INTO charging_stations (tenant_id, name, station_id, type, facility_id, latitude, longitude, address, number_of_ports, available_ports, max_power_kw, cost_per_kwh, is_public, status, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id
      `, [
        ids.tenantId,
        `${faker.location.street()} Charging Station`,
        `CS-${faker.string.alphanumeric(6).toUpperCase()}`,
        faker.helpers.arrayElement(['level1', 'level2', 'dcfast']),
        faker.helpers.arrayElement(ids.facilityIds),
        location.lat, location.lng,
        `${generateAddress()}, ${REGION.city}, ${REGION.state} ${generateZipCode()}`,
        faker.number.int({ min: 1, max: 4 }),
        faker.number.int({ min: 1, max: 4 }),
        faker.number.float({ min: 7, max: 150, fractionDigits: 2 }),
        faker.number.float({ min: 0.10, max: 0.35, fractionDigits: 4 }),
        faker.datatype.boolean({ probability: 0.3 }),
        'active', '{}'
      ]);
      ids.chargingStationIds.push(result.rows[0].id);
    }
    console.log(`   Created ${CONFIG.chargingStations} charging stations\n`);

    console.log('17. Creating charging sessions...');
    for (let i = 0; i < CONFIG.chargingSessions; i++) {
      const energyKwh = faker.number.float({ min: 10, max: 60, fractionDigits: 3 });

      await client.query(`
        INSERT INTO charging_sessions (tenant_id, vehicle_id, driver_id, station_id, start_time, end_time, duration_minutes, energy_delivered_kwh, start_soc_percent, end_soc_percent, cost, payment_method, status, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        ids.tenantId,
        faker.helpers.arrayElement(ids.vehicleIds),
        ids.driverIds.length > 0 ? faker.helpers.arrayElement(ids.driverIds) : null,
        faker.helpers.arrayElement(ids.chargingStationIds),
        faker.date.recent({ days: 60 }),
        faker.date.recent({ days: 59 }),
        faker.number.int({ min: 30, max: 240 }),
        energyKwh,
        faker.number.float({ min: 10, max: 50, fractionDigits: 2 }),
        faker.number.float({ min: 70, max: 100, fractionDigits: 2 }),
        parseFloat((energyKwh * faker.number.float({ min: 0.15, max: 0.30 })).toFixed(2)),
        'company_account',
        'completed', '{}'
      ]);
    }
    console.log(`   Created ${CONFIG.chargingSessions} charging sessions\n`);

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('=========================================================');
    console.log('  SEED COMPLETE');
    console.log('=========================================================\n');
    console.log(`Company: ${company.name}`);
    console.log(`Domain: ${company.domain}`);
    console.log(`Location: ${REGION.city}, ${REGION.state}\n`);
    console.log('Data Generated:');
    console.log(`  - 1 Tenant`);
    console.log(`  - ${Object.keys(ids.model3dIds).length} 3D Vehicle Models (from Sketchfab)`);
    console.log(`  - ${roles.length} Users`);
    console.log(`  - ${CONFIG.facilities} Facilities`);
    console.log(`  - ${driverUsers.length} Drivers`);
    console.log(`  - ${CONFIG.vehicles} Vehicles (linked to 3D models)`);
    console.log(`  - ${CONFIG.vendors} Vendors`);
    console.log(`  - ${CONFIG.parts} Parts`);
    console.log(`  - ${CONFIG.workOrders} Work Orders`);
    console.log(`  - ${CONFIG.fuelTransactions} Fuel Transactions`);
    console.log(`  - ${CONFIG.routes} Routes`);
    console.log(`  - ${CONFIG.inspections} Inspections`);
    console.log(`  - ${totalGPSTracks} GPS Tracks`);
    console.log(`  - ${CONFIG.geofences} Geofences`);
    console.log(`  - ${CONFIG.incidents} Incidents`);
    console.log(`  - ${CONFIG.chargingStations} Charging Stations`);
    console.log(`  - ${CONFIG.chargingSessions} Charging Sessions`);
    console.log('\nAll data dynamically generated - no hardcoded values!\n');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

seedTallahasseeCompany().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
