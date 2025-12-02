/**
 * Test data fixtures for all Fleet Management modules
 */

export const testTenant = {
  id: 'test-tenant-001',
  name: 'Test Fleet Company',
  status: 'active' as const,
  createdAt: '2024-01-01',
  maxUsers: 100,
  maxVehicles: 250,
};

export const testUser = {
  id: 'user-001',
  tenantId: 'test-tenant-001',
  email: 'test@example.com',
  name: 'Test User',
  role: 'fleet-manager' as const,
  permissions: ['vehicles.view', 'vehicles.edit', 'drivers.view'],
  active: true,
};

export const testVehicle = {
  id: 'vehicle-001',
  tenantId: 'test-tenant-001',
  vin: '1HGCM82633A123456',
  make: 'Toyota',
  model: 'Camry',
  year: 2023,
  type: 'sedan' as const,
  licensePlate: 'ABC-1234',
  fuelType: 'gasoline' as const,
  status: 'active' as const,
  currentMileage: 15000,
};

export const testDriver = {
  id: 'driver-001',
  tenantId: 'test-tenant-001',
  name: 'John Doe',
  email: 'john.doe@example.com',
  licenseNumber: 'DL123456789',
  licenseExpiry: '2025-12-31',
  status: 'active' as const,
};

export const testWorkOrder = {
  id: 'wo-001',
  tenantId: 'test-tenant-001',
  vehicleId: 'vehicle-001',
  title: 'Oil Change',
  description: 'Regular maintenance oil change',
  status: 'open' as const,
  priority: 'medium' as const,
  scheduledDate: '2024-12-01',
};

export const testGeofence = {
  id: 'geo-001',
  tenantId: 'test-tenant-001',
  name: 'Downtown Depot',
  type: 'circle' as const,
  center: { lat: 40.7128, lng: -74.0060 },
  radius: 500,
  color: '#3B82F6',
  active: true,
  triggers: {
    onEnter: true,
    onExit: true,
    onDwell: false,
  },
  alertPriority: 'medium' as const,
};

export const testOSHAForm = {
  id: 'osha-001',
  tenantId: 'test-tenant-001',
  formType: '300' as const,
  title: 'Test Incident Report',
  description: 'Minor workplace injury',
  incidentDate: '2024-11-01',
  location: 'Warehouse A',
  department: 'Operations',
  severity: 'minor' as const,
  status: 'draft' as const,
};

export const testPolicy = {
  id: 'policy-001',
  tenantId: 'test-tenant-001',
  name: 'Speed Limit Policy',
  description: 'Alert when vehicles exceed 75 mph',
  type: 'safety' as const,
  mode: 'monitor' as const,
  status: 'active' as const,
  confidenceScore: 0.85,
  executionCount: 0,
  violationCount: 0,
};

export const testChargingStation = {
  id: 'station-001',
  tenantId: 'test-tenant-001',
  name: 'Main Depot Charger 1',
  location: 'Main Depot',
  stationType: 'depot' as const,
  chargerType: 'level-2' as const,
  powerOutput: 7.2,
  status: 'online' as const,
  available: true,
};

export const testRoute = {
  id: 'route-001',
  tenantId: 'test-tenant-001',
  name: 'Downtown Delivery Route',
  vehicleId: 'vehicle-001',
  driverId: 'driver-001',
  optimizationMode: 'time' as const,
  stops: [
    { address: '123 Main St', arrivalTime: '09:00', completionTime: '09:15' },
    { address: '456 Oak Ave', arrivalTime: '09:30', completionTime: '09:45' },
  ],
  optimizationScore: 88.5,
  totalDistance: 25.3,
  totalDuration: 45,
};
