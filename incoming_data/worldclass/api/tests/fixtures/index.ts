/**
 * Test Fixtures for CTAFleet System
 * Provides comprehensive test data generation for all entities
 */

import { randomUUID } from 'crypto';

// ========== User & Tenant Fixtures ==========

export const createMockTenant = (overrides: Partial<any> = {}) => ({
  id: randomUUID(),
  name: 'Test Tenant',
  subscription_tier: 'enterprise',
  status: 'active',
  created_at: new Date().toISOString(),
  settings: {
    timezone: 'America/New_York',
    currency: 'USD',
    date_format: 'MM/DD/YYYY',
  },
  ...overrides,
});

export const createMockUser = (overrides: Partial<any> = {}) => ({
  id: randomUUID(),
  tenant_id: 'test-tenant-id',
  email: `test${Date.now()}@example.com`,
  first_name: 'Test',
  last_name: 'User',
  role: 'fleet_manager',
  status: 'active',
  password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz',
  created_at: new Date().toISOString(),
  last_login: new Date().toISOString(),
  permissions: ['vehicles:read', 'vehicles:write', 'drivers:read', 'drivers:write'],
  ...overrides,
});

// ========== Vehicle Fixtures ==========

export const createMockVehicle = (overrides: Partial<any> = {}) => ({
  id: randomUUID(),
  tenant_id: 'test-tenant-id',
  vehicle_number: `V-${Math.floor(Math.random() * 10000)}`,
  vin: `1HGBH41JXMN${Math.floor(Math.random() * 100000)}`,
  license_plate: `ABC${Math.floor(Math.random() * 1000)}`,
  make: 'Ford',
  model: 'F-150',
  year: 2023,
  color: 'White',
  vehicle_type: 'pickup_truck',
  status: 'active',
  odometer: 15000,
  fuel_type: 'gasoline',
  purchase_date: '2023-01-15',
  purchase_price: 45000,
  current_value: 42000,
  department: 'Operations',
  location: 'Main Garage',
  ...overrides,
});

export const createMockElectricVehicle = (overrides: Partial<any> = {}) => ({
  ...createMockVehicle({
    fuel_type: 'electric',
    make: 'Tesla',
    model: 'Model 3',
    battery_capacity_kwh: 75,
    range_miles: 350,
    charging_level: 'Level 2',
    ...overrides,
  }),
});

// ========== Driver Fixtures ==========

export const createMockDriver = (overrides: Partial<any> = {}) => ({
  id: randomUUID(),
  tenant_id: 'test-tenant-id',
  employee_id: `EMP-${Math.floor(Math.random() * 10000)}`,
  first_name: 'John',
  last_name: 'Driver',
  email: `driver${Date.now()}@example.com`,
  phone: '555-0123',
  license_number: `DL${Math.floor(Math.random() * 1000000)}`,
  license_state: 'NY',
  license_expiry: '2026-12-31',
  cdl_class: 'Class B',
  status: 'active',
  hire_date: '2022-06-01',
  date_of_birth: '1985-03-15',
  address: '123 Main St, New York, NY 10001',
  ...overrides,
});

// ========== Maintenance Fixtures ==========

export const createMockMaintenanceSchedule = (overrides: Partial<any> = {}) => ({
  id: randomUUID(),
  tenant_id: 'test-tenant-id',
  vehicle_id: randomUUID(),
  maintenance_type: 'oil_change',
  description: 'Regular oil change service',
  interval_type: 'mileage',
  interval_value: 5000,
  last_service_date: '2024-01-15',
  last_service_odometer: 10000,
  next_service_date: '2024-07-15',
  next_service_odometer: 15000,
  status: 'scheduled',
  cost_estimate: 75.00,
  vendor_id: null,
  ...overrides,
});

export const createMockWorkOrder = (overrides: Partial<any> = {}) => ({
  id: randomUUID(),
  tenant_id: 'test-tenant-id',
  vehicle_id: randomUUID(),
  work_order_number: `WO-${Math.floor(Math.random() * 100000)}`,
  type: 'preventive_maintenance',
  priority: 'medium',
  status: 'open',
  description: 'Scheduled maintenance',
  scheduled_date: new Date(Date.now() + 86400000).toISOString(),
  odometer: 15000,
  assigned_to: null,
  vendor_id: null,
  labor_cost: 0,
  parts_cost: 0,
  total_cost: 0,
  created_at: new Date().toISOString(),
  ...overrides,
});

// ========== Fuel Fixtures ==========

export const createMockFuelTransaction = (overrides: Partial<any> = {}) => ({
  id: randomUUID(),
  tenant_id: 'test-tenant-id',
  vehicle_id: randomUUID(),
  driver_id: randomUUID(),
  transaction_date: new Date().toISOString(),
  fuel_type: 'gasoline',
  gallons: 15.5,
  price_per_gallon: 3.85,
  total_cost: 59.68,
  odometer: 15500,
  location: 'Shell Station - Main St',
  card_number: '****1234',
  receipt_number: `REC-${Math.floor(Math.random() * 100000)}`,
  ...overrides,
});

// ========== Inspection Fixtures ==========

export const createMockInspection = (overrides: Partial<any> = {}) => ({
  id: randomUUID(),
  tenant_id: 'test-tenant-id',
  vehicle_id: randomUUID(),
  inspector_id: randomUUID(),
  inspection_type: 'pre_trip',
  inspection_date: new Date().toISOString(),
  odometer: 15000,
  status: 'passed',
  defects_found: 0,
  defects: [],
  notes: 'All systems normal',
  signature_url: null,
  ...overrides,
});

// ========== Incident Fixtures ==========

export const createMockIncident = (overrides: Partial<any> = {}) => ({
  id: randomUUID(),
  tenant_id: 'test-tenant-id',
  vehicle_id: randomUUID(),
  driver_id: randomUUID(),
  incident_number: `INC-${Math.floor(Math.random() * 100000)}`,
  incident_type: 'accident',
  severity: 'minor',
  incident_date: new Date().toISOString(),
  location: '123 Main St, New York, NY',
  description: 'Minor fender bender in parking lot',
  police_report_number: null,
  injuries: false,
  property_damage: true,
  estimated_damage_cost: 1500,
  status: 'under_review',
  fault_determination: null,
  insurance_claim_number: null,
  photos: [],
  witnesses: [],
  ...overrides,
});

// ========== Telematics Fixtures ==========

export const createMockTelematicsData = (overrides: Partial<any> = {}) => ({
  id: randomUUID(),
  vehicle_id: randomUUID(),
  timestamp: new Date().toISOString(),
  latitude: 40.7128,
  longitude: -74.0060,
  speed: 45,
  heading: 90,
  odometer: 15000,
  fuel_level: 75,
  engine_status: 'running',
  rpm: 2000,
  coolant_temp: 195,
  battery_voltage: 12.6,
  ...overrides,
});

// ========== Document Fixtures ==========

export const createMockDocument = (overrides: Partial<any> = {}) => ({
  id: randomUUID(),
  tenant_id: 'test-tenant-id',
  document_type: 'vehicle_registration',
  title: 'Vehicle Registration',
  file_name: 'registration.pdf',
  file_url: 'https://storage.example.com/documents/registration.pdf',
  file_size: 102400,
  mime_type: 'application/pdf',
  related_entity_type: 'vehicle',
  related_entity_id: randomUUID(),
  uploaded_by: randomUUID(),
  upload_date: new Date().toISOString(),
  expiry_date: '2025-12-31',
  status: 'active',
  tags: ['registration', 'legal'],
  ...overrides,
});

// ========== Asset Fixtures ==========

export const createMockAsset = (overrides: Partial<any> = {}) => ({
  id: randomUUID(),
  tenant_id: 'test-tenant-id',
  asset_name: 'Test Asset',
  asset_type: 'equipment',
  asset_tag: `TAG-${Math.floor(Math.random() * 100000)}`,
  serial_number: `SN-${Math.floor(Math.random() * 1000000)}`,
  manufacturer: 'Test Manufacturer',
  model: 'Test Model',
  purchase_date: '2023-01-01',
  purchase_price: 5000,
  current_value: 4500,
  depreciation_rate: 10,
  status: 'active',
  location: 'Warehouse A',
  department: 'Operations',
  ...overrides,
});

// ========== Geofence Fixtures ==========

export const createMockGeofence = (overrides: Partial<any> = {}) => ({
  id: randomUUID(),
  tenant_id: 'test-tenant-id',
  name: 'Main Office',
  description: 'Main office location geofence',
  type: 'circle',
  center_lat: 40.7128,
  center_lng: -74.0060,
  radius_meters: 500,
  color: '#3B82F6',
  active: true,
  alerts_enabled: true,
  ...overrides,
});

// ========== Route Fixtures ==========

export const createMockRoute = (overrides: Partial<any> = {}) => ({
  id: randomUUID(),
  tenant_id: 'test-tenant-id',
  route_name: 'Route A',
  description: 'Morning delivery route',
  start_location: { lat: 40.7128, lng: -74.0060 },
  end_location: { lat: 40.7580, lng: -73.9855 },
  waypoints: [],
  estimated_duration_minutes: 45,
  estimated_distance_miles: 15,
  status: 'active',
  ...overrides,
});

// ========== Alert Fixtures ==========

export const createMockAlert = (overrides: Partial<any> = {}) => ({
  id: randomUUID(),
  tenant_id: 'test-tenant-id',
  alert_type: 'maintenance_due',
  severity: 'medium',
  title: 'Maintenance Due',
  message: 'Vehicle V-123 is due for oil change',
  entity_type: 'vehicle',
  entity_id: randomUUID(),
  triggered_at: new Date().toISOString(),
  acknowledged: false,
  acknowledged_by: null,
  acknowledged_at: null,
  resolved: false,
  resolved_at: null,
  ...overrides,
});

// ========== Utility Functions ==========

export const createBulkMockData = <T>(
  factory: (overrides?: any) => T,
  count: number,
  overrides?: any
): T[] => {
  return Array.from({ length: count }, () => factory(overrides));
};

export const createMockDateRange = (daysBack: number = 30) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);
  return { startDate, endDate };
};

// ========== Multi-Tenant Test Scenarios ==========

export const createMultiTenantScenario = () => {
  const tenant1 = createMockTenant({ id: 'tenant-1', name: 'Acme Corp' });
  const tenant2 = createMockTenant({ id: 'tenant-2', name: 'Wayne Enterprises' });

  const tenant1Vehicles = createBulkMockData(createMockVehicle, 5, { tenant_id: tenant1.id });
  const tenant2Vehicles = createBulkMockData(createMockVehicle, 3, { tenant_id: tenant2.id });

  const tenant1Users = createBulkMockData(createMockUser, 3, { tenant_id: tenant1.id });
  const tenant2Users = createBulkMockData(createMockUser, 2, { tenant_id: tenant2.id });

  return {
    tenant1,
    tenant2,
    tenant1Vehicles,
    tenant2Vehicles,
    tenant1Users,
    tenant2Users,
  };
};

// ========== Edge Case Fixtures ==========

export const createEdgeCaseVehicle = (scenario: string) => {
  const scenarios: Record<string, any> = {
    high_mileage: {
      odometer: 250000,
      status: 'needs_attention',
      current_value: 5000,
    },
    new: {
      odometer: 50,
      purchase_date: new Date().toISOString().split('T')[0],
      status: 'active',
    },
    out_of_service: {
      status: 'out_of_service',
      notes: 'Major engine repair needed',
    },
    electric_low_battery: {
      fuel_type: 'electric',
      battery_level: 5,
      status: 'needs_charging',
    },
  };

  return createMockVehicle(scenarios[scenario] || {});
};

export const createConflictScenario = () => ({
  localVersion: createMockVehicle({ updated_at: new Date(Date.now() - 60000).toISOString() }),
  serverVersion: createMockVehicle({ updated_at: new Date().toISOString() }),
});
