/**
 * Factory Tests - Verify deterministic output and data validity
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  TenantFactory,
  UserFactory,
  VehicleFactory,
  DriverFactory,
  WorkOrderFactory,
  MaintenanceScheduleFactory,
  FuelTransactionFactory,
  RouteFactory,
  IncidentFactory,
  ComplianceRecordFactory,
} from '../factories';

describe('TenantFactory', () => {
  let factory: TenantFactory;
  const SEED = 'test-seed-2026';

  beforeEach(() => {
    factory = new TenantFactory(SEED);
  });

  it('should generate deterministic tenants with same seed', () => {
    const tenant1 = factory.build(0);
    const factory2 = new TenantFactory(SEED);
    const tenant2 = factory2.build(0);

    expect(tenant1.id).toBe(tenant2.id);
    expect(tenant1.name).toBe(tenant2.name);
    expect(tenant1.subdomain).toBe(tenant2.subdomain);
  });

  it('should generate unique tenants for different indexes', () => {
    const tenant1 = factory.build(0);
    const tenant2 = factory.build(1);

    expect(tenant1.id).not.toBe(tenant2.id);
    expect(tenant1.name).not.toBe(tenant2.name);
  });

  it('should have valid tenant structure', () => {
    const tenant = factory.build(0);

    expect(tenant.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(tenant.name).toBeTruthy();
    expect(tenant.settings).toHaveProperty('timezone');
    expect(tenant.settings).toHaveProperty('features');
    expect(typeof tenant.is_active).toBe('boolean');
  });

  it('should build multiple tenants', () => {
    const tenants = factory.buildList(5);

    expect(tenants).toHaveLength(5);
    expect(new Set(tenants.map((t) => t.id)).size).toBe(5);
  });
});

describe('UserFactory', () => {
  let factory: UserFactory;
  const SEED = 'test-seed-2026';
  const TENANT_ID = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    factory = new UserFactory(SEED);
  });

  it('should generate deterministic users', () => {
    const user1 = factory.build(TENANT_ID, 0);
    const factory2 = new UserFactory(SEED);
    const user2 = factory2.build(TENANT_ID, 0);

    expect(user1.id).toBe(user2.id);
    expect(user1.email).toBe(user2.email);
  });

  it('should hash passwords with bcrypt', () => {
    const user = factory.build(TENANT_ID, 0);

    expect(user.password_hash).toBeTruthy();
    expect(user.password_hash).toMatch(/^\$2[aby]\$/); // bcrypt hash prefix
    expect(user.password_hash.length).toBeGreaterThan(50);
  });

  it('should assign valid roles', () => {
    const users = factory.buildList(TENANT_ID, 20);
    const validRoles = ['SuperAdmin', 'Admin', 'Manager', 'Supervisor', 'Driver', 'Dispatcher', 'Mechanic', 'Viewer'];

    users.forEach((user) => {
      expect(validRoles).toContain(user.role);
    });
  });

  it('should build specific roles correctly', () => {
    const admin = factory.buildAdmin(TENANT_ID, 0);
    const driver = factory.buildDriver(TENANT_ID, 1);
    const mechanic = factory.buildMechanic(TENANT_ID, 2);

    expect(admin.role).toBe('Admin');
    expect(driver.role).toBe('Driver');
    expect(mechanic.role).toBe('Mechanic');
  });

  it('should have valid email format', () => {
    const users = factory.buildList(TENANT_ID, 10);

    users.forEach((user) => {
      expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });
  });
});

describe('VehicleFactory', () => {
  let factory: VehicleFactory;
  const SEED = 'test-seed-2026';
  const TENANT_ID = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    factory = new VehicleFactory(SEED);
  });

  it('should generate valid VIN numbers', () => {
    const vehicles = factory.buildList(TENANT_ID, 10);

    vehicles.forEach((vehicle) => {
      expect(vehicle.vin).toBeTruthy();
      expect(vehicle.vin?.length).toBe(17);
      expect(vehicle.vin).toMatch(/^[A-HJ-NPR-Z0-9]{17}$/); // Valid VIN pattern
    });
  });

  it('should generate valid license plates', () => {
    const vehicles = factory.buildList(TENANT_ID, 10);

    vehicles.forEach((vehicle) => {
      expect(vehicle.license_plate).toBeTruthy();
      expect(vehicle.license_plate?.length).toBeGreaterThan(0);
    });
  });

  it('should have realistic mileage for vehicle age', () => {
    const vehicle = factory.build(TENANT_ID, 0);

    if (vehicle.year && vehicle.current_mileage) {
      const age = 2026 - vehicle.year;
      expect(vehicle.current_mileage).toBeGreaterThan(age * 5000);
      expect(vehicle.current_mileage).toBeLessThan(age * 25000);
    }
  });

  it('should assign valid vehicle types and fuel types', () => {
    const vehicles = factory.buildList(TENANT_ID, 20);
    const validTypes = ['sedan', 'suv', 'truck', 'van', 'bus', 'emergency', 'construction', 'specialty'];
    const validFuelTypes = ['gasoline', 'diesel', 'electric', 'hybrid', 'propane', 'cng', 'hydrogen'];

    vehicles.forEach((vehicle) => {
      if (vehicle.type) expect(validTypes).toContain(vehicle.type);
      if (vehicle.fuel_type) expect(validFuelTypes).toContain(vehicle.fuel_type);
    });
  });

  it('should build electric vehicles correctly', () => {
    const ev = factory.buildElectric(TENANT_ID, 0);

    expect(ev.fuel_type).toBe('electric');
    expect(ev.make).toBe('Tesla');
  });

  it('should have valid GPS coordinates', () => {
    const vehicles = factory.buildList(TENANT_ID, 10);

    vehicles.forEach((vehicle) => {
      if (vehicle.current_latitude && vehicle.current_longitude) {
        expect(vehicle.current_latitude).toBeGreaterThan(-90);
        expect(vehicle.current_latitude).toBeLessThan(90);
        expect(vehicle.current_longitude).toBeGreaterThan(-180);
        expect(vehicle.current_longitude).toBeLessThan(180);
      }
    });
  });
});

describe('DriverFactory', () => {
  let factory: DriverFactory;
  const SEED = 'test-seed-2026';
  const TENANT_ID = '123e4567-e89b-12d3-a456-426614174000';
  const USER_ID = '987e6543-e21b-12d3-a456-426614174999';

  beforeEach(() => {
    factory = new DriverFactory(SEED);
  });

  it('should generate valid driver license numbers', () => {
    const drivers = factory.buildList(TENANT_ID, [USER_ID], {});

    drivers.forEach((driver) => {
      expect(driver.license_number).toBeTruthy();
      expect(driver.license_number.length).toBeGreaterThan(5);
    });
  });

  it('should have valid safety scores', () => {
    const drivers = factory.buildList(TENANT_ID, Array(10).fill(USER_ID), {});

    drivers.forEach((driver) => {
      expect(driver.safety_score).toBeGreaterThanOrEqual(0);
      expect(driver.safety_score).toBeLessThanOrEqual(100);
    });
  });

  it('should have valid phone numbers', () => {
    const driver = factory.build(TENANT_ID, USER_ID, 0);

    expect(driver.phone).toMatch(/^\d{3}-\d{3}-\d{4}$/);
  });

  it('should build safe drivers with high safety scores', () => {
    const safeDriver = factory.buildSafeDriver(TENANT_ID, USER_ID, 0);

    expect(safeDriver.safety_score).toBeGreaterThanOrEqual(90);
    expect(safeDriver.status).toBe('active');
  });
});

describe('WorkOrderFactory', () => {
  let factory: WorkOrderFactory;
  const SEED = 'test-seed-2026';
  const TENANT_ID = '123e4567-e89b-12d3-a456-426614174000';
  const VEHICLE_ID = '987e6543-e21b-12d3-a456-426614174999';

  beforeEach(() => {
    factory = new WorkOrderFactory(SEED);
  });

  it('should generate unique work order numbers', () => {
    const workOrders = factory.buildList(TENANT_ID, VEHICLE_ID, 5);

    const numbers = workOrders.map((wo) => wo.work_order_number);
    expect(new Set(numbers).size).toBe(5);
  });

  it('should have valid status transitions', () => {
    const workOrders = factory.buildList(TENANT_ID, VEHICLE_ID, 20);
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled', 'on_hold', 'failed'];

    workOrders.forEach((wo) => {
      expect(validStatuses).toContain(wo.status);
    });
  });

  it('should have actual costs only when completed', () => {
    const workOrders = factory.buildList(TENANT_ID, VEHICLE_ID, 30);

    workOrders.forEach((wo) => {
      if (wo.status === 'completed') {
        expect(wo.actual_cost).toBeTruthy();
        expect(wo.actual_end).toBeTruthy();
      }
    });
  });

  it('should have estimated costs for all work orders', () => {
    const workOrders = factory.buildList(TENANT_ID, VEHICLE_ID, 10);

    workOrders.forEach((wo) => {
      expect(wo.estimated_cost).toBeGreaterThan(0);
    });
  });
});

describe('FuelTransactionFactory', () => {
  let factory: FuelTransactionFactory;
  const SEED = 'test-seed-2026';
  const TENANT_ID = '123e4567-e89b-12d3-a456-426614174000';
  const VEHICLE_ID = '987e6543-e21b-12d3-a456-426614174999';
  const DRIVER_ID = '456e7890-e21b-12d3-a456-426614174888';

  beforeEach(() => {
    factory = new FuelTransactionFactory(SEED);
  });

  it('should have valid fuel amounts', () => {
    const transactions = factory.buildList(TENANT_ID, VEHICLE_ID, DRIVER_ID, 'gasoline', 10);

    transactions.forEach((tx) => {
      expect(tx.gallons).toBeGreaterThan(0);
      expect(tx.cost_per_gallon).toBeGreaterThan(0);
      expect(tx.total_cost).toBeGreaterThan(0);
    });
  });

  it('should calculate total cost correctly', () => {
    const transactions = factory.buildList(TENANT_ID, VEHICLE_ID, DRIVER_ID, 'diesel', 10);

    transactions.forEach((tx) => {
      const expectedTotal = tx.gallons! * tx.cost_per_gallon!;
      expect(Math.abs(tx.total_cost! - expectedTotal)).toBeLessThan(0.1);
    });
  });

  it('should have valid vendor names', () => {
    const transactions = factory.buildList(TENANT_ID, VEHICLE_ID, DRIVER_ID, 'gasoline', 10);

    transactions.forEach((tx) => {
      expect(tx.vendor).toBeTruthy();
      expect(tx.vendor?.length).toBeGreaterThan(0);
    });
  });
});

describe('RouteFactory', () => {
  let factory: RouteFactory;
  const SEED = 'test-seed-2026';
  const TENANT_ID = '123e4567-e89b-12d3-a456-426614174000';
  const VEHICLE_ID = '987e6543-e21b-12d3-a456-426614174999';
  const DRIVER_ID = '456e7890-e21b-12d3-a456-426614174888';

  beforeEach(() => {
    factory = new RouteFactory(SEED);
  });

  it('should have different start and end locations', () => {
    const routes = factory.buildList(TENANT_ID, VEHICLE_ID, DRIVER_ID, 10);

    routes.forEach((route) => {
      expect(route.start_location).not.toBe(route.end_location);
    });
  });

  it('should have valid GeoJSON route geometry', () => {
    const route = factory.build(TENANT_ID, VEHICLE_ID, DRIVER_ID, 0);

    expect(route.route_geometry).toHaveProperty('type', 'LineString');
    expect(route.route_geometry).toHaveProperty('coordinates');
    expect(Array.isArray(route.route_geometry?.coordinates)).toBe(true);
  });

  it('should have waypoints structure', () => {
    const route = factory.build(TENANT_ID, VEHICLE_ID, DRIVER_ID, 0);

    expect(route.waypoints).toHaveProperty('stops');
    expect(Array.isArray(route.waypoints?.stops)).toBe(true);
  });

  it('should have realistic estimated durations', () => {
    const routes = factory.buildList(TENANT_ID, VEHICLE_ID, DRIVER_ID, 10);

    routes.forEach((route) => {
      expect(route.estimated_duration).toBeTruthy();
      expect(route.estimated_duration).toBeGreaterThan(0);
      // Routes can be long distance, up to 72 hours for cross-country
      expect(route.estimated_duration!).toBeLessThan(4320); // Less than 72 hours
    });
  });
});

describe('IncidentFactory', () => {
  let factory: IncidentFactory;
  const SEED = 'test-seed-2026';
  const TENANT_ID = '123e4567-e89b-12d3-a456-426614174000';
  const VEHICLE_IDS = ['v1', 'v2', 'v3'];
  const DRIVER_IDS = ['d1', 'd2', 'd3'];

  beforeEach(() => {
    factory = new IncidentFactory(SEED);
  });

  it('should have severity matching injuries/fatalities', () => {
    const incidents = factory.buildList(TENANT_ID, 20, VEHICLE_IDS, DRIVER_IDS);

    incidents.forEach((incident) => {
      if (incident.severity === 'fatal') {
        expect(incident.fatalities_count).toBeGreaterThan(0);
      }
      if (incident.severity === 'minor') {
        expect(incident.injuries_count || 0).toBeLessThanOrEqual(1);
        expect(incident.fatalities_count || 0).toBe(0);
      }
    });
  });

  it('should have valid GPS coordinates', () => {
    const incidents = factory.buildList(TENANT_ID, 10, VEHICLE_IDS, DRIVER_IDS);

    incidents.forEach((incident) => {
      expect(incident.latitude).toBeGreaterThan(-90);
      expect(incident.latitude).toBeLessThan(90);
      expect(incident.longitude).toBeGreaterThan(-180);
      expect(incident.longitude).toBeLessThan(180);
    });
  });

  it('should have estimated costs correlating with severity', () => {
    const minorIncidents = factory.buildList(TENANT_ID, 10, VEHICLE_IDS, DRIVER_IDS)
      .filter((i) => i.severity === 'minor');
    const criticalIncidents = factory.buildList(TENANT_ID, 30, VEHICLE_IDS, DRIVER_IDS)
      .filter((i) => i.severity === 'critical');

    if (minorIncidents.length > 0 && criticalIncidents.length > 0) {
      const avgMinor = minorIncidents.reduce((sum, i) => sum + (i.estimated_cost || 0), 0) / minorIncidents.length;
      const avgCritical = criticalIncidents.reduce((sum, i) => sum + (i.estimated_cost || 0), 0) / criticalIncidents.length;

      expect(avgCritical).toBeGreaterThan(avgMinor);
    }
  });
});

describe('ComplianceRecordFactory', () => {
  let factory: ComplianceRecordFactory;
  const SEED = 'test-seed-2026';
  const TENANT_ID = '123e4567-e89b-12d3-a456-426614174000';
  const ENTITY_ID = '987e6543-e21b-12d3-a456-426614174999';

  beforeEach(() => {
    factory = new ComplianceRecordFactory(SEED);
  });

  it('should generate driver-specific certifications for drivers', () => {
    const records = factory.buildList(TENANT_ID, 'driver', ENTITY_ID, 5);

    const driverCerts = ['CDL_CLASS_A', 'CDL_CLASS_B', 'HAZMAT_ENDORSEMENT', 'MEDICAL_CARD', 'DEFENSIVE_DRIVING'];
    records.forEach((record) => {
      expect(driverCerts).toContain(record.certification_type);
    });
  });

  it('should generate vehicle-specific certifications for vehicles', () => {
    const records = factory.buildList(TENANT_ID, 'vehicle', ENTITY_ID, 5);

    const vehicleCerts = ['DOT_INSPECTION', 'EMISSIONS_TEST', 'VEHICLE_REGISTRATION', 'INSURANCE_CERTIFICATE'];
    records.forEach((record) => {
      expect(vehicleCerts).toContain(record.certification_type);
    });
  });

  it('should have expiry dates after issue dates', () => {
    const records = factory.buildList(TENANT_ID, 'driver', ENTITY_ID, 10);

    records.forEach((record) => {
      if (record.issue_date && record.expiry_date) {
        expect(record.expiry_date.getTime()).toBeGreaterThan(record.issue_date.getTime());
      }
    });
  });

  it('should mark expired certifications correctly', () => {
    const expired = factory.buildExpired(TENANT_ID, 'driver', ENTITY_ID, 0);

    expect(expired.status).toBe('expired');
    if (expired.expiry_date) {
      expect(expired.expiry_date.getTime()).toBeLessThan(Date.now());
    }
  });
});

describe('Deterministic Seeding', () => {
  const SEED = 'deterministic-test';

  it('should generate identical data with same seed across all factories', () => {
    const tenant1 = new TenantFactory(SEED).build(0);
    const tenant2 = new TenantFactory(SEED).build(0);

    // Compare core deterministic fields, not timestamps
    expect(tenant1.id).toBe(tenant2.id);
    expect(tenant1.name).toBe(tenant2.name);
    expect(tenant1.subdomain).toBe(tenant2.subdomain);

    const user1 = new UserFactory(SEED).build('tenant-1', 0);
    const user2 = new UserFactory(SEED).build('tenant-1', 0);

    // Compare deterministic fields, bcrypt salts will differ
    expect(user1.id).toBe(user2.id);
    expect(user1.email).toBe(user2.email);
    expect(user1.first_name).toBe(user2.first_name);
    expect(user1.last_name).toBe(user2.last_name);
    expect(user1.role).toBe(user2.role);
  });
});
