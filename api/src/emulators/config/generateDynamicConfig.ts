/**
 * Dynamic Emulator Configuration Generator
 * Generates fleet data dynamically using Faker - no hardcoded values
 * Called at emulator startup to create fresh realistic data
 */

import { faker } from '@faker-js/faker';

// Configure Faker for consistent regional data
faker.seed(Date.now());

// ============================================================================
// REGION CONFIGURATION (Tallahassee, FL)
// ============================================================================
const REGION = {
  center: { lat: 30.4383, lng: -84.2807 },
  city: 'Tallahassee',
  state: 'FL',
  stateCode: 'FL',
  zipCodePrefix: '323',
  areaCode: '850',
  timezone: 'America/New_York',
  homeBaseName: 'Fleet Operations Center'
};

// ============================================================================
// SKETCHFAB 3D MODEL MAPPINGS
// ============================================================================
const SKETCHFAB_MODELS: Record<string, { url: string; id: string; embedUrl: string }> = {
  'Ford F-150': {
    url: 'https://sketchfab.com/3d-models/ford-f-150-c205cde66b1d4f14b1820b89de7b8d23',
    id: 'c205cde66b1d4f14b1820b89de7b8d23',
    embedUrl: 'https://sketchfab.com/models/c205cde66b1d4f14b1820b89de7b8d23/embed'
  },
  'Ford F-250': {
    url: 'https://sketchfab.com/3d-models/ford-f-250-super-duty',
    id: 'ford-f-250',
    embedUrl: 'https://sketchfab.com/models/ford-f-250/embed'
  },
  'Ford Transit': {
    url: 'https://sketchfab.com/3d-models/ford-transit-custom-double-cargo-van-8d2529f41c7d4404881f6c4014d4f04c',
    id: '8d2529f41c7d4404881f6c4014d4f04c',
    embedUrl: 'https://sketchfab.com/models/8d2529f41c7d4404881f6c4014d4f04c/embed'
  },
  'Ford Explorer': {
    url: 'https://sketchfab.com/3d-models/ford-explorer-suv',
    id: 'ford-explorer',
    embedUrl: 'https://sketchfab.com/models/ford-explorer/embed'
  },
  'Chevrolet Silverado': {
    url: 'https://sketchfab.com/3d-models/2019-chevrolet-silverado-trail-boss-z71-652324cc8a974d3a9869ce2b0f3beaaa',
    id: '652324cc8a974d3a9869ce2b0f3beaaa',
    embedUrl: 'https://sketchfab.com/models/652324cc8a974d3a9869ce2b0f3beaaa/embed'
  },
  'Chevrolet Colorado': {
    url: 'https://sketchfab.com/3d-models/chevrolet-colorado',
    id: 'chevrolet-colorado',
    embedUrl: 'https://sketchfab.com/models/chevrolet-colorado/embed'
  },
  'Toyota Camry': {
    url: 'https://sketchfab.com/3d-models/toyota-camry-fd9b89c8c12b48f98915fac1392e3b67',
    id: 'fd9b89c8c12b48f98915fac1392e3b67',
    embedUrl: 'https://sketchfab.com/models/fd9b89c8c12b48f98915fac1392e3b67/embed'
  },
  'Toyota Tacoma': {
    url: 'https://sketchfab.com/3d-models/toyota-tacoma',
    id: 'toyota-tacoma',
    embedUrl: 'https://sketchfab.com/models/toyota-tacoma/embed'
  },
  'Honda Accord': {
    url: 'https://sketchfab.com/3d-models/2021-honda-accord-e742636e46814de5af1568542e7c9bdb',
    id: 'e742636e46814de5af1568542e7c9bdb',
    embedUrl: 'https://sketchfab.com/models/e742636e46814de5af1568542e7c9bdb/embed'
  },
  'Honda CR-V': {
    url: 'https://sketchfab.com/3d-models/honda-cr-v',
    id: 'honda-cr-v',
    embedUrl: 'https://sketchfab.com/models/honda-cr-v/embed'
  },
  'Tesla Model 3': {
    url: 'https://sketchfab.com/3d-models/tesla-2018-model-3-5ef9b845aaf44203b6d04e2c677e444f',
    id: '5ef9b845aaf44203b6d04e2c677e444f',
    embedUrl: 'https://sketchfab.com/models/5ef9b845aaf44203b6d04e2c677e444f/embed'
  },
  'Tesla Model Y': {
    url: 'https://sketchfab.com/3d-models/tesla-model-y',
    id: 'tesla-model-y',
    embedUrl: 'https://sketchfab.com/models/tesla-model-y/embed'
  },
  'Mercedes-Benz Sprinter': {
    url: 'https://sketchfab.com/3d-models/mercedes-benz-sprinter-152f62800be34652af0545487129ca2e',
    id: '152f62800be34652af0545487129ca2e',
    embedUrl: 'https://sketchfab.com/models/152f62800be34652af0545487129ca2e/embed'
  },
  'Ram ProMaster': {
    url: 'https://sketchfab.com/3d-models/ram-promaster',
    id: 'ram-promaster',
    embedUrl: 'https://sketchfab.com/models/ram-promaster/embed'
  }
};

// ============================================================================
// VEHICLE TEMPLATES
// ============================================================================
const VEHICLE_TEMPLATES = [
  { make: 'Ford', model: 'F-150', type: 'truck', fuelType: 'gasoline', tankSize: 26, mpg: 18 },
  { make: 'Ford', model: 'F-250', type: 'truck', fuelType: 'diesel', tankSize: 34, mpg: 15 },
  { make: 'Ford', model: 'Transit', type: 'van', fuelType: 'gasoline', tankSize: 25, mpg: 19 },
  { make: 'Ford', model: 'Explorer', type: 'suv', fuelType: 'gasoline', tankSize: 18, mpg: 24 },
  { make: 'Chevrolet', model: 'Silverado', type: 'truck', fuelType: 'gasoline', tankSize: 26, mpg: 19 },
  { make: 'Chevrolet', model: 'Colorado', type: 'truck', fuelType: 'gasoline', tankSize: 21, mpg: 20 },
  { make: 'Toyota', model: 'Camry', type: 'sedan', fuelType: 'gasoline', tankSize: 15, mpg: 30 },
  { make: 'Toyota', model: 'Tacoma', type: 'truck', fuelType: 'gasoline', tankSize: 21, mpg: 21 },
  { make: 'Honda', model: 'Accord', type: 'sedan', fuelType: 'gasoline', tankSize: 14, mpg: 32 },
  { make: 'Honda', model: 'CR-V', type: 'suv', fuelType: 'gasoline', tankSize: 22, mpg: 28 },
  { make: 'Tesla', model: 'Model 3', type: 'sedan', fuelType: 'electric', tankSize: 0, mpg: 0, batteryKwh: 75, rangeKm: 500 },
  { make: 'Tesla', model: 'Model Y', type: 'suv', fuelType: 'electric', tankSize: 0, mpg: 0, batteryKwh: 75, rangeKm: 530 },
  { make: 'Mercedes-Benz', model: 'Sprinter', type: 'van', fuelType: 'diesel', tankSize: 25, mpg: 20 },
  { make: 'Ram', model: 'ProMaster', type: 'van', fuelType: 'gasoline', tankSize: 24, mpg: 18 }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
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

// ============================================================================
// VEHICLE GENERATOR
// ============================================================================
export interface EmulatorVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  type: string;
  vin: string;
  licensePlate: string;
  tankSize: number;
  fuelEfficiency: number;
  batteryCapacity?: number;
  electricRange?: number;
  startingLocation: { lat: number; lng: number };
  homeBase: { lat: number; lng: number; name: string };
  driverBehavior: string;
  features: string[];
  sketchfabModel?: {
    url: string;
    embedUrl: string;
    downloadable: boolean;
    format: string;
  };
}

function generateEmulatorVehicle(index: number): EmulatorVehicle {
  const template = faker.helpers.arrayElement(VEHICLE_TEMPLATES);
  const year = faker.number.int({ min: 2020, max: 2024 });
  const location = generateCoordNear(REGION.center, 0.5);
  const behaviors = ['normal', 'cautious', 'aggressive'];
  const isElectric = template.fuelType === 'electric';

  const modelKey = `${template.make} ${template.model}`;
  const sketchfab = SKETCHFAB_MODELS[modelKey];

  const features = isElectric
    ? ['gps', 'iot', 'camera', 'ev']
    : faker.helpers.arrayElements(['obd2', 'gps', 'iot', 'camera', 'cargo'], { min: 2, max: 4 });

  const vehicle: EmulatorVehicle = {
    id: `VEH-${String(index + 1).padStart(3, '0')}`,
    make: template.make,
    model: template.model,
    year,
    type: template.type,
    vin: generateVIN(),
    licensePlate: generateLicensePlate(),
    tankSize: template.tankSize,
    fuelEfficiency: template.mpg,
    startingLocation: location,
    homeBase: { ...REGION.center, name: REGION.homeBaseName },
    driverBehavior: faker.helpers.arrayElement(behaviors),
    features
  };

  if (isElectric && template.batteryKwh && template.rangeKm) {
    vehicle.batteryCapacity = template.batteryKwh;
    vehicle.electricRange = template.rangeKm;
  }

  if (sketchfab) {
    vehicle.sketchfabModel = {
      url: sketchfab.url,
      embedUrl: sketchfab.embedUrl,
      downloadable: true,
      format: 'glTF'
    };
  }

  return vehicle;
}

// ============================================================================
// ROUTE GENERATOR
// ============================================================================
export interface EmulatorRoute {
  id: string;
  name: string;
  type: string;
  estimatedDuration: number;
  estimatedDistance: number;
  waypoints: Array<{
    lat: number;
    lng: number;
    name: string;
    type: string;
    stopDuration: number;
    address: string;
  }>;
}

function generateEmulatorRoute(index: number): EmulatorRoute {
  const routeTypes = ['delivery', 'pickup', 'service', 'shuttle', 'emergency'];
  const type = faker.helpers.arrayElement(routeTypes);
  const numStops = faker.number.int({ min: 3, max: 6 });

  const waypoints = [];
  for (let i = 0; i < numStops; i++) {
    const location = generateCoordNear(REGION.center, 8);
    waypoints.push({
      lat: location.lat,
      lng: location.lng,
      name: i === 0 ? 'Start' : i === numStops - 1 ? 'End' : `Stop ${i}`,
      type: i === 0 || i === numStops - 1 ? 'depot' : faker.helpers.arrayElement(['delivery', 'pickup', 'service']),
      stopDuration: i === 0 || i === numStops - 1 ? 0 : faker.number.int({ min: 5, max: 30 }),
      address: `${faker.location.buildingNumber()} ${faker.location.street()}, ${REGION.city}, ${REGION.state}`
    });
  }

  return {
    id: `RT-${String(index + 1).padStart(4, '0')}`,
    name: `${faker.location.street()} ${faker.helpers.arrayElement(['Route', 'Run', 'Loop', 'Express'])}`,
    type,
    estimatedDuration: faker.number.int({ min: 30, max: 180 }),
    estimatedDistance: faker.number.float({ min: 5, max: 80, fractionDigits: 1 }),
    waypoints
  };
}

// ============================================================================
// GEOFENCE GENERATOR
// ============================================================================
export interface EmulatorGeofence {
  id: string;
  name: string;
  type: string;
  center: { lat: number; lng: number };
  radius: number;
  color: string;
  alertOnEntry: boolean;
  alertOnExit: boolean;
}

function generateEmulatorGeofence(index: number): EmulatorGeofence {
  const types = ['facility', 'operational', 'restricted', 'customer'];
  const type = faker.helpers.arrayElement(types);
  const location = generateCoordNear(REGION.center, 10);

  return {
    id: `GEO-${String(index + 1).padStart(3, '0')}`,
    name: `${faker.location.street()} ${faker.helpers.arrayElement(['Zone', 'Area', 'Perimeter', 'Region'])}`,
    type,
    center: location,
    radius: faker.number.int({ min: 100, max: 3000 }),
    color: faker.color.rgb({ format: 'hex' }),
    alertOnEntry: type === 'restricted',
    alertOnExit: true
  };
}

// ============================================================================
// MAIN GENERATOR FUNCTIONS
// ============================================================================
export interface EmulatorConfig {
  vehicles: EmulatorVehicle[];
  routes: EmulatorRoute[];
  geofences: EmulatorGeofence[];
  generatedAt: string;
  region: typeof REGION;
}

export function generateVehiclesConfig(count: number = 15): { vehicles: EmulatorVehicle[] } {
  const vehicles: EmulatorVehicle[] = [];
  for (let i = 0; i < count; i++) {
    vehicles.push(generateEmulatorVehicle(i));
  }
  return { vehicles };
}

export function generateRoutesConfig(routeCount: number = 10, geofenceCount: number = 8): { routes: EmulatorRoute[]; geofences: EmulatorGeofence[] } {
  const routes: EmulatorRoute[] = [];
  const geofences: EmulatorGeofence[] = [];

  for (let i = 0; i < routeCount; i++) {
    routes.push(generateEmulatorRoute(i));
  }

  for (let i = 0; i < geofenceCount; i++) {
    geofences.push(generateEmulatorGeofence(i));
  }

  return { routes, geofences };
}

export function generateFullConfig(vehicleCount: number = 15, routeCount: number = 10, geofenceCount: number = 8): EmulatorConfig {
  const vehiclesData = generateVehiclesConfig(vehicleCount);
  const routesData = generateRoutesConfig(routeCount, geofenceCount);

  return {
    vehicles: vehiclesData.vehicles,
    routes: routesData.routes,
    geofences: routesData.geofences,
    generatedAt: new Date().toISOString(),
    region: REGION
  };
}

// Export for direct use
export default {
  generateVehiclesConfig,
  generateRoutesConfig,
  generateFullConfig,
  REGION,
  SKETCHFAB_MODELS,
  VEHICLE_TEMPLATES
};
