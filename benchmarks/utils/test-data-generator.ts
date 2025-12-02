/**
 * Test Data Generator for Map Performance Benchmarks
 *
 * Generates realistic test data for benchmarking map components
 * with various dataset sizes and configurations.
 */

import { Vehicle, GISFacility, TrafficCamera } from '@/lib/types';

/**
 * Tallahassee, FL area boundaries
 */
const TALLAHASSEE_BOUNDS = {
  north: 30.5383,
  south: 30.3383,
  east: -84.1807,
  west: -84.3807,
};

/**
 * Vehicle types with their weights for realistic distribution
 */
const VEHICLE_TYPES = [
  { type: 'sedan' as const, weight: 30 },
  { type: 'suv' as const, weight: 25 },
  { type: 'truck' as const, weight: 20 },
  { type: 'van' as const, weight: 15 },
  { type: 'emergency' as const, weight: 5 },
  { type: 'specialty' as const, weight: 5 },
] as const;

/**
 * Vehicle statuses with their weights
 */
const VEHICLE_STATUSES = [
  { status: 'active' as const, weight: 40 },
  { status: 'idle' as const, weight: 30 },
  { status: 'charging' as const, weight: 15 },
  { status: 'service' as const, weight: 10 },
  { status: 'emergency' as const, weight: 3 },
  { status: 'offline' as const, weight: 2 },
] as const;

/**
 * Facility types with their weights
 */
const FACILITY_TYPES = [
  { type: 'depot' as const, weight: 40 },
  { type: 'office' as const, weight: 30 },
  { type: 'service-center' as const, weight: 20 },
  { type: 'fueling-station' as const, weight: 10 },
] as const;

/**
 * Generates a random number between min and max
 */
function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generates a random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

/**
 * Picks a random item based on weighted distribution
 */
function weightedRandom<T extends { weight: number }>(items: readonly T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item;
    }
  }

  return items[0];
}

/**
 * Generates a random coordinate within Tallahassee bounds
 */
function randomCoordinate(): { lat: number; lng: number } {
  return {
    lat: randomBetween(TALLAHASSEE_BOUNDS.south, TALLAHASSEE_BOUNDS.north),
    lng: randomBetween(TALLAHASSEE_BOUNDS.west, TALLAHASSEE_BOUNDS.east),
  };
}

/**
 * Generates a random VIN
 */
function generateVIN(): string {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  return Array.from({ length: 17 }, () => chars[randomInt(0, chars.length - 1)]).join('');
}

/**
 * Generates a random license plate
 */
function generateLicensePlate(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  return (
    Array.from({ length: 3 }, () => letters[randomInt(0, letters.length - 1)]).join('') +
    Array.from({ length: 4 }, () => numbers[randomInt(0, numbers.length - 1)]).join('')
  );
}

/**
 * Generates a single vehicle with realistic data
 */
export function generateVehicle(id: number, tenantId: string = 'test-tenant'): Vehicle {
  const vehicleType = weightedRandom(VEHICLE_TYPES).type;
  const status = weightedRandom(VEHICLE_STATUSES).status;
  const location = randomCoordinate();
  const year = randomInt(2018, 2024);

  const makes = ['Ford', 'Chevrolet', 'Toyota', 'Honda', 'RAM', 'GMC', 'Nissan'];
  const make = makes[randomInt(0, makes.length - 1)];

  return {
    id: `vehicle-${id}`,
    tenantId,
    number: `V${String(id).padStart(5, '0')}`,
    type: vehicleType,
    make,
    model: `Model ${randomInt(1, 10)}`,
    year,
    vin: generateVIN(),
    licensePlate: generateLicensePlate(),
    status,
    location: {
      lat: location.lat,
      lng: location.lng,
      address: `${randomInt(100, 9999)} Main St, Tallahassee, FL`,
    },
    region: 'North',
    department: ['Operations', 'Maintenance', 'Administration', 'Emergency'][randomInt(0, 3)],
    fuelLevel: randomInt(0, 100),
    fuelType: ['gasoline', 'diesel', 'electric', 'hybrid'][randomInt(0, 3)] as any,
    mileage: randomInt(1000, 150000),
    assignedDriver: status === 'active' ? `Driver ${randomInt(1, 100)}` : undefined,
    ownership: ['owned', 'leased', 'rented'][randomInt(0, 2)] as any,
    lastService: new Date(Date.now() - randomInt(1, 90) * 24 * 60 * 60 * 1000).toISOString(),
    nextService: new Date(Date.now() + randomInt(1, 90) * 24 * 60 * 60 * 1000).toISOString(),
    alerts: [],
  };
}

/**
 * Generates a single facility with realistic data
 */
export function generateFacility(id: number, tenantId: string = 'test-tenant'): GISFacility {
  const facilityType = weightedRandom(FACILITY_TYPES).type;
  const location = randomCoordinate();

  const names = {
    depot: ['North Depot', 'South Depot', 'Central Depot', 'East Depot'],
    office: ['Main Office', 'Regional Office', 'Branch Office', 'Corporate HQ'],
    'service-center': ['Service Center Alpha', 'Service Center Beta', 'Quick Service'],
    'fueling-station': ['Fuel Station 1', 'Fuel Station 2', 'Main Fueling'],
  };

  return {
    id: `facility-${id}`,
    tenantId,
    name: names[facilityType][randomInt(0, names[facilityType].length - 1)],
    type: facilityType,
    location: {
      lat: location.lat,
      lng: location.lng,
    },
    address: `${randomInt(100, 9999)} Industrial Blvd, Tallahassee, FL`,
    status: Math.random() > 0.1 ? 'operational' : ('under-maintenance' as any),
    capacity: randomInt(10, 200),
    currentOccupancy: randomInt(0, 100),
  };
}

/**
 * Generates a single traffic camera with realistic data
 */
export function generateCamera(id: number): TrafficCamera {
  const location = randomCoordinate();
  const operational = Math.random() > 0.05;

  const streets = [
    'Monroe St',
    'Tennessee St',
    'Apalachee Pkwy',
    'Capital Circle',
    'Thomasville Rd',
    'Mahan Dr',
  ];

  const street1 = streets[randomInt(0, streets.length - 1)];
  const street2 = streets[randomInt(0, streets.length - 1)];

  return {
    id: `camera-${id}`,
    name: `Traffic Camera ${id}`,
    latitude: location.lat,
    longitude: location.lng,
    address: `${street1}, Tallahassee, FL`,
    crossStreets: `${street1} & ${street2}`,
    operational,
    cameraUrl: operational ? `https://example.com/camera/${id}` : undefined,
  };
}

/**
 * Generates multiple vehicles
 */
export function generateVehicles(count: number, tenantId?: string): Vehicle[] {
  return Array.from({ length: count }, (_, i) => generateVehicle(i + 1, tenantId));
}

/**
 * Generates multiple facilities
 */
export function generateFacilities(count: number, tenantId?: string): GISFacility[] {
  return Array.from({ length: count }, (_, i) => generateFacility(i + 1, tenantId));
}

/**
 * Generates multiple cameras
 */
export function generateCameras(count: number): TrafficCamera[] {
  return Array.from({ length: count }, (_, i) => generateCamera(i + 1));
}

/**
 * Generates a complete dataset with all entity types
 */
export function generateDataset(options: {
  vehicles?: number;
  facilities?: number;
  cameras?: number;
  tenantId?: string;
}) {
  return {
    vehicles: options.vehicles ? generateVehicles(options.vehicles, options.tenantId) : [],
    facilities: options.facilities ? generateFacilities(options.facilities, options.tenantId) : [],
    cameras: options.cameras ? generateCameras(options.cameras) : [],
  };
}

/**
 * Predefined benchmark datasets
 */
export const BENCHMARK_DATASETS = {
  tiny: generateDataset({ vehicles: 10, facilities: 2, cameras: 5 }),
  small: generateDataset({ vehicles: 100, facilities: 10, cameras: 20 }),
  medium: generateDataset({ vehicles: 1000, facilities: 50, cameras: 100 }),
  large: generateDataset({ vehicles: 10000, facilities: 200, cameras: 500 }),
  xlarge: generateDataset({ vehicles: 100000, facilities: 1000, cameras: 2000 }),
} as const;

/**
 * Generates clustered data (markers in specific areas)
 */
export function generateClusteredDataset(
  clusters: number,
  markersPerCluster: number,
  clusterRadius: number = 0.01
) {
  const vehicles: Vehicle[] = [];

  for (let c = 0; c < clusters; c++) {
    const clusterCenter = randomCoordinate();

    for (let m = 0; m < markersPerCluster; m++) {
      const vehicle = generateVehicle(c * markersPerCluster + m + 1);
      vehicle.location = {
        ...vehicle.location,
        lat: clusterCenter.lat + randomBetween(-clusterRadius, clusterRadius),
        lng: clusterCenter.lng + randomBetween(-clusterRadius, clusterRadius),
      };
      vehicles.push(vehicle);
    }
  }

  return vehicles;
}

/**
 * Generates uniformly distributed data
 */
export function generateUniformDataset(count: number) {
  return generateVehicles(count);
}
