/**
 * Test Data Fixtures for Map Visual Regression Testing
 *
 * Provides consistent test data across all visual tests to ensure
 * reproducible screenshots and meaningful comparisons.
 */

import type { Vehicle, GISFacility, TrafficCamera } from '@/lib/types';

// ============================================================================
// Vehicle Test Data
// ============================================================================

export const SINGLE_VEHICLE: Vehicle[] = [
  {
    id: 'visual-test-v1',
    tenantId: 'test-tenant',
    number: 'VEH-001',
    type: 'sedan',
    make: 'Toyota',
    model: 'Camry',
    year: 2023,
    vin: 'TEST123456789VIN1',
    licensePlate: 'TEST-001',
    status: 'active',
    location: {
      lat: 30.4383,
      lng: -84.2807,
      address: '100 S Adams St, Tallahassee, FL 32301',
    },
    region: 'North Florida',
    department: 'Operations',
    fuelLevel: 75,
    fuelType: 'gasoline',
    mileage: 15000,
    assignedDriver: 'John Smith',
    ownership: 'owned',
    lastService: '2024-01-15',
    nextService: '2024-04-15',
    alerts: [],
    tags: ['active', 'operational'],
  },
];

export const MULTIPLE_VEHICLES: Vehicle[] = [
  {
    id: 'visual-test-v1',
    tenantId: 'test-tenant',
    number: 'VEH-001',
    type: 'sedan',
    make: 'Toyota',
    model: 'Camry',
    year: 2023,
    vin: 'TEST123456789VIN1',
    licensePlate: 'TEST-001',
    status: 'active',
    location: {
      lat: 30.4383,
      lng: -84.2807,
      address: '100 S Adams St, Tallahassee, FL 32301',
    },
    region: 'North Florida',
    department: 'Operations',
    fuelLevel: 75,
    fuelType: 'gasoline',
    mileage: 15000,
    assignedDriver: 'John Smith',
    ownership: 'owned',
    lastService: '2024-01-15',
    nextService: '2024-04-15',
    alerts: [],
  },
  {
    id: 'visual-test-v2',
    tenantId: 'test-tenant',
    number: 'VEH-002',
    type: 'truck',
    make: 'Ford',
    model: 'F-150',
    year: 2022,
    vin: 'TEST123456789VIN2',
    licensePlate: 'TEST-002',
    status: 'idle',
    location: {
      lat: 30.4500,
      lng: -84.2700,
      address: '200 N Monroe St, Tallahassee, FL 32301',
    },
    region: 'North Florida',
    department: 'Maintenance',
    fuelLevel: 50,
    fuelType: 'diesel',
    mileage: 45000,
    assignedDriver: 'Jane Doe',
    ownership: 'leased',
    lastService: '2024-02-01',
    nextService: '2024-05-01',
    alerts: [],
  },
  {
    id: 'visual-test-v3',
    tenantId: 'test-tenant',
    number: 'VEH-003',
    type: 'van',
    make: 'Mercedes-Benz',
    model: 'Sprinter',
    year: 2024,
    vin: 'TEST123456789VIN3',
    licensePlate: 'TEST-003',
    status: 'service',
    location: {
      lat: 30.4200,
      lng: -84.2900,
      address: '300 W Tennessee St, Tallahassee, FL 32304',
    },
    region: 'North Florida',
    department: 'Service',
    fuelLevel: 25,
    fuelType: 'diesel',
    mileage: 28000,
    ownership: 'owned',
    lastService: '2024-03-01',
    nextService: '2024-06-01',
    alerts: ['service-due', 'low-fuel'],
  },
  {
    id: 'visual-test-v4',
    tenantId: 'test-tenant',
    number: 'VEH-004',
    type: 'emergency',
    make: 'Chevrolet',
    model: 'Tahoe',
    year: 2023,
    vin: 'TEST123456789VIN4',
    licensePlate: 'TEST-004',
    status: 'emergency',
    location: {
      lat: 30.4600,
      lng: -84.2600,
      address: '400 E Park Ave, Tallahassee, FL 32301',
    },
    region: 'North Florida',
    department: 'Emergency',
    fuelLevel: 90,
    fuelType: 'gasoline',
    mileage: 12000,
    assignedDriver: 'Bob Johnson',
    ownership: 'owned',
    lastService: '2024-01-20',
    nextService: '2024-04-20',
    alerts: ['emergency-active'],
  },
  {
    id: 'visual-test-v5',
    tenantId: 'test-tenant',
    number: 'VEH-005',
    type: 'suv',
    make: 'Tesla',
    model: 'Model Y',
    year: 2024,
    vin: 'TEST123456789VIN5',
    licensePlate: 'TEST-005',
    status: 'charging',
    location: {
      lat: 30.4300,
      lng: -84.2750,
      address: '500 W Gaines St, Tallahassee, FL 32304',
    },
    region: 'North Florida',
    department: 'Executive',
    fuelLevel: 45,
    fuelType: 'electric',
    mileage: 8500,
    assignedDriver: 'Alice Brown',
    ownership: 'owned',
    lastService: '2024-02-15',
    nextService: '2024-08-15',
    alerts: [],
  },
];

export const VEHICLE_STATUS_EXAMPLES: Vehicle[] = [
  { ...MULTIPLE_VEHICLES[0], status: 'active' },
  { ...MULTIPLE_VEHICLES[1], id: 'v-idle', status: 'idle', location: { ...MULTIPLE_VEHICLES[1].location, lat: 30.4350 } },
  { ...MULTIPLE_VEHICLES[2], id: 'v-charging', status: 'charging', location: { ...MULTIPLE_VEHICLES[2].location, lat: 30.4250 } },
  { ...MULTIPLE_VEHICLES[3], id: 'v-service', status: 'service', location: { ...MULTIPLE_VEHICLES[3].location, lat: 30.4450 } },
  { ...MULTIPLE_VEHICLES[4], id: 'v-emergency', status: 'emergency', location: { ...MULTIPLE_VEHICLES[4].location, lat: 30.4550 } },
  { ...MULTIPLE_VEHICLES[0], id: 'v-offline', status: 'offline', location: { ...MULTIPLE_VEHICLES[0].location, lat: 30.4150 } },
];

// ============================================================================
// Facility Test Data
// ============================================================================

export const SINGLE_FACILITY: GISFacility[] = [
  {
    id: 'visual-test-f1',
    name: 'Main Office',
    type: 'office',
    status: 'operational',
    capacity: 50,
    address: '100 S Adams St, Tallahassee, FL 32301',
    location: {
      lat: 30.4383,
      lng: -84.2807,
    },
  },
];

export const MULTIPLE_FACILITIES: GISFacility[] = [
  {
    id: 'visual-test-f1',
    name: 'Main Office',
    type: 'office',
    status: 'operational',
    capacity: 50,
    address: '100 S Adams St, Tallahassee, FL 32301',
    location: {
      lat: 30.4383,
      lng: -84.2807,
    },
  },
  {
    id: 'visual-test-f2',
    name: 'Service Depot',
    type: 'depot',
    status: 'operational',
    capacity: 25,
    address: '200 N Monroe St, Tallahassee, FL 32301',
    location: {
      lat: 30.4450,
      lng: -84.2850,
    },
  },
  {
    id: 'visual-test-f3',
    name: 'Maintenance Center',
    type: 'service-center',
    status: 'maintenance',
    capacity: 15,
    address: '300 W Tennessee St, Tallahassee, FL 32304',
    location: {
      lat: 30.4300,
      lng: -84.2950,
    },
  },
  {
    id: 'visual-test-f4',
    name: 'Fueling Station',
    type: 'fueling-station',
    status: 'operational',
    capacity: 10,
    address: '400 E Park Ave, Tallahassee, FL 32301',
    location: {
      lat: 30.4550,
      lng: -84.2650,
    },
  },
];

// ============================================================================
// Traffic Camera Test Data
// ============================================================================

export const SINGLE_CAMERA: TrafficCamera[] = [
  {
    id: 'visual-test-c1',
    name: 'Traffic Camera 101',
    latitude: 30.4400,
    longitude: -84.2750,
    address: '500 W Gaines St, Tallahassee, FL 32304',
    crossStreets: 'Monroe St & Gaines St',
    operational: true,
    cameraUrl: 'https://example.com/camera/101',
  },
];

export const MULTIPLE_CAMERAS: TrafficCamera[] = [
  {
    id: 'visual-test-c1',
    name: 'Traffic Camera 101',
    latitude: 30.4400,
    longitude: -84.2750,
    address: '500 W Gaines St, Tallahassee, FL 32304',
    crossStreets: 'Monroe St & Gaines St',
    operational: true,
    cameraUrl: 'https://example.com/camera/101',
  },
  {
    id: 'visual-test-c2',
    name: 'Traffic Camera 102',
    latitude: 30.4350,
    longitude: -84.2850,
    address: '600 Apalachee Pkwy, Tallahassee, FL 32301',
    crossStreets: 'Apalachee Pkwy & Adams St',
    operational: true,
    cameraUrl: 'https://example.com/camera/102',
  },
  {
    id: 'visual-test-c3',
    name: 'Traffic Camera 103',
    latitude: 30.4500,
    longitude: -84.2700,
    address: '700 Capital Circle NE, Tallahassee, FL 32301',
    crossStreets: null,
    operational: false,
    cameraUrl: null,
  },
];

// ============================================================================
// Combined Test Scenarios
// ============================================================================

export const ALL_MARKERS = {
  vehicles: MULTIPLE_VEHICLES,
  facilities: MULTIPLE_FACILITIES,
  cameras: MULTIPLE_CAMERAS,
};

export const EMPTY_MAP = {
  vehicles: [],
  facilities: [],
  cameras: [],
};

export const DENSE_MAP = {
  vehicles: [
    ...MULTIPLE_VEHICLES,
    ...MULTIPLE_VEHICLES.map((v, i) => ({
      ...v,
      id: `dense-v${i + 10}`,
      location: {
        ...v.location,
        lat: v.location.lat + (Math.random() * 0.02 - 0.01),
        lng: v.location.lng + (Math.random() * 0.02 - 0.01),
      },
    })),
  ],
  facilities: MULTIPLE_FACILITIES,
  cameras: MULTIPLE_CAMERAS,
};

// ============================================================================
// Map Configuration Scenarios
// ============================================================================

export const MAP_ZOOM_LEVELS = {
  city: 13,
  region: 10,
  state: 6,
  country: 4,
  street: 16,
};

export const MAP_CENTERS = {
  tallahassee: [30.4383, -84.2807] as [number, number],
  miami: [25.7617, -80.1918] as [number, number],
  orlando: [28.5383, -81.3792] as [number, number],
  tampa: [27.9506, -82.4572] as [number, number],
};

// ============================================================================
// Error State Data
// ============================================================================

export const ERROR_SCENARIOS = {
  invalidCoordinates: {
    vehicles: [
      {
        ...SINGLE_VEHICLE[0],
        location: {
          lat: 999, // Invalid latitude
          lng: -84.2807,
          address: 'Invalid Location',
        },
      },
    ],
  },
  missingLocation: {
    vehicles: [
      {
        ...SINGLE_VEHICLE[0],
        location: null as any,
      },
    ],
  },
};
