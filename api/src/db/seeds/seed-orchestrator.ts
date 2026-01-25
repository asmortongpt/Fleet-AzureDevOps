/**
 * Seed Orchestrator - Manages dependency-ordered seeding with transactions
 */
import { Pool, PoolClient } from 'pg';
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
} from './factories';
import type { SeedConfig } from './types';

export class SeedOrchestrator {
  private pool: Pool;
  private config: SeedConfig;
  private seedValue: string;

  // Factories
  private tenantFactory: TenantFactory;
  private userFactory: UserFactory;
  private vehicleFactory: VehicleFactory;
  private driverFactory: DriverFactory;
  private workOrderFactory: WorkOrderFactory;
  private maintenanceFactory: MaintenanceScheduleFactory;
  private fuelFactory: FuelTransactionFactory;
  private routeFactory: RouteFactory;
  private incidentFactory: IncidentFactory;
  private complianceFactory: ComplianceRecordFactory;

  constructor(pool: Pool, config: Partial<SeedConfig> = {}, seed: string = 'fleet-test-2026') {
    this.pool = pool;
    this.seedValue = seed;

    // Default configuration
    this.config = {
      tenantCount: config.tenantCount || 3,
      usersPerTenant: config.usersPerTenant || 20,
      vehiclesPerTenant: config.vehiclesPerTenant || 50,
      driversPerTenant: config.driversPerTenant || 15,
      routesPerVehicle: config.routesPerVehicle || 5,
      maintenancePerVehicle: config.maintenancePerVehicle || 8,
      fuelTransactionsPerVehicle: config.fuelTransactionsPerVehicle || 12,
      incidentsPerTenant: config.incidentsPerTenant || 10,
      complianceRecordsPerEntity: config.complianceRecordsPerEntity || 3,
      workOrdersPerVehicle: config.workOrdersPerVehicle || 4,
    };

    // Initialize factories
    this.tenantFactory = new TenantFactory(seed);
    this.userFactory = new UserFactory(seed);
    this.vehicleFactory = new VehicleFactory(seed);
    this.driverFactory = new DriverFactory(seed);
    this.workOrderFactory = new WorkOrderFactory(seed);
    this.maintenanceFactory = new MaintenanceScheduleFactory(seed);
    this.fuelFactory = new FuelTransactionFactory(seed);
    this.routeFactory = new RouteFactory(seed);
    this.incidentFactory = new IncidentFactory(seed);
    this.complianceFactory = new ComplianceRecordFactory(seed);
  }

  /**
   * Run complete seeding process with transaction
   */
  async seed(): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      console.log('🌱 Starting Fleet Management System seeding...\n');

      const startTime = Date.now();

      // Seed in dependency order
      await this.seedTenants(client);
      await this.seedUsers(client);
      await this.seedDrivers(client);
      await this.seedVehicles(client);
      await this.seedWorkOrders(client);
      // await this.seedMaintenanceSchedules(client);
      // await this.seedFuelTransactions(client);
      // await this.seedRoutes(client);
      // await this.seedIncidents(client);
      // await this.seedComplianceRecords(client);

      await client.query('COMMIT');

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\n✅ Seeding completed successfully in ${duration}s`);
      console.log(`📊 Default test password: ${this.userFactory.getDefaultPassword()}`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error during seeding, rolling back:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Clear all seed data
   */
  async reset(): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      console.log('🗑️  Resetting database...\n');

      // Delete in reverse dependency order
      const tables = [
        'compliance_records',
        'incidents',
        'routes',
        'fuel_transactions',
        'maintenance_schedules',
        'work_orders',
        'drivers',
        'vehicles',
        'users',
        'tenants',
      ];

      for (const table of tables) {
        const result = await client.query(`DELETE FROM ${table}`);
        console.log(`   Deleted ${result.rowCount} rows from ${table}`);
      }

      await client.query('COMMIT');
      console.log('\n✅ Database reset completed');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error during reset, rolling back:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Seed tenants
   */
  private async seedTenants(client: PoolClient): Promise<Map<number, string>> {
    console.log('📋 Seeding tenants...');
    const tenantMap = new Map<number, string>();

    const tenants = this.tenantFactory.buildList(this.config.tenantCount);

    for (const tenant of tenants) {
      const result = await client.query(

        `INSERT INTO tenants (id, name, slug, domain, billing_email, subscription_tier, settings, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          tenant.id,
          tenant.name,
          tenant.subdomain, // Map to slug
          `${tenant.subdomain}.example.com`, // Map to domain
          `billing@${tenant.subdomain}.example.com`, // billing_email
          'standard', // subscription_tier
          JSON.stringify(tenant.settings),
          tenant.is_active,
          tenant.created_at,
          tenant.updated_at,
        ]
      );
      tenantMap.set(tenants.indexOf(tenant), result.rows[0].id);
    }

    console.log(`   ✓ Created ${tenants.length} tenants`);
    return tenantMap;
  }

  /**
   * Seed users
   */
  private async seedUsers(client: PoolClient): Promise<Map<string, string[]>> {
    console.log('👥 Seeding users...');
    const userMap = new Map<string, string[]>();
    let loggedAdmin = false;

    const tenantIds = await this.getTenantIds(client);

    for (const tenantId of tenantIds) {
      const users = this.userFactory.buildList(tenantId, this.config.usersPerTenant);
      const userIds: string[] = [];

      for (const user of users) {
        await client.query(
          `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, is_active, last_login_at, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            user.id,
            user.tenant_id,
            user.email,
            user.password_hash,
            user.first_name,
            user.last_name,
            user.role,
            user.is_active,
            user.last_login_at,
            user.created_at,
            user.updated_at,
          ]
        );
        userIds.push(user.id);

        if (!loggedAdmin && (user.role === 'Admin' || user.role === 'SuperAdmin')) {
          console.log(`\n🔑 Test Admin Credentials: ${user.email} / ${this.userFactory.getDefaultPassword()}`);
          console.log(`   Tenant ID: ${tenantId}\n`);
          loggedAdmin = true;
        }
      }

      userMap.set(tenantId, userIds);
    }

    const totalUsers = Array.from(userMap.values()).reduce((sum, ids) => sum + ids.length, 0);
    console.log(`   ✓ Created ${totalUsers} users across ${tenantIds.length} tenants`);
    return userMap;
  }

  /**
   * Seed drivers
   */
  private async seedDrivers(client: PoolClient): Promise<Map<string, string[]>> {
    console.log('🚗 Seeding drivers...');
    const driverMap = new Map<string, string[]>();

    const tenantIds = await this.getTenantIds(client);

    for (const tenantId of tenantIds) {
      // Get driver-role users for this tenant
      const driverUserIds = await this.getDriverUserIds(client, tenantId);
      const limitedUserIds = driverUserIds.slice(0, this.config.driversPerTenant);

      const drivers = this.driverFactory.buildList(tenantId, limitedUserIds);
      const driverIds: string[] = [];

      for (const driver of drivers) {
        await client.query(
          `INSERT INTO drivers (id, tenant_id, user_id, first_name, last_name, employee_number, license_number, license_state, license_expiry_date, status, hire_date, phone, email, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            driver.id,
            driver.tenant_id,
            driver.user_id,
            driver.first_name,
            driver.last_name,
            driver.employee_number,
            driver.license_number,
            driver.license_state,
            driver.license_expiration, // Maps to license_expiry_date
            driver.status,
            driver.hire_date,
            driver.phone,
            driver.email,
            driver.created_at,
            driver.updated_at,
          ]
        );
        driverIds.push(driver.id);
      }

      driverMap.set(tenantId, driverIds);
    }

    const totalDrivers = Array.from(driverMap.values()).reduce((sum, ids) => sum + ids.length, 0);
    console.log(`   ✓ Created ${totalDrivers} drivers`);
    return driverMap;
  }

  /**
   * Seed vehicles
   */
  private async seedVehicles(client: PoolClient): Promise<Map<string, string[]>> {
    console.log('🚙 Seeding vehicles...');
    const vehicleMap = new Map<string, string[]>();

    const tenantIds = await this.getTenantIds(client);

    for (const tenantId of tenantIds) {
      const driverIds = await this.getDriverUserIds(client, tenantId);
      const vehicles = this.vehicleFactory.buildList(tenantId, this.config.vehiclesPerTenant);
      const vehicleIds: string[] = [];

      for (let i = 0; i < vehicles.length; i++) {
        const vehicle = vehicles[i];
        // Assign 70% of vehicles to drivers
        const assignedDriverId = i < vehicles.length * 0.7 && driverIds.length > 0
          ? driverIds[i % driverIds.length]
          : null;

        await client.query(
          `INSERT INTO vehicles (id, tenant_id, name, number, vin, make, model, year, type, fuel_type, status, license_plate, odometer, latitude, longitude, assigned_driver_id, assigned_facility_id, metadata, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
          [
            vehicle.id,
            vehicle.tenant_id,
            `${vehicle.year} ${vehicle.make} ${vehicle.model}`, // name
            vehicle.number,
            vehicle.vin,
            vehicle.make,
            vehicle.model,
            vehicle.year,
            vehicle.type,
            vehicle.fuel_type,
            vehicle.status,
            vehicle.license_plate,
            vehicle.odometer,
            vehicle.latitude,
            vehicle.longitude,
            assignedDriverId,
            vehicle.assigned_facility_id,
            JSON.stringify(vehicle.metadata),
            vehicle.created_at,
            vehicle.updated_at,
          ]
        );
        vehicleIds.push(vehicle.id);
      }

      vehicleMap.set(tenantId, vehicleIds);
    }

    const totalVehicles = Array.from(vehicleMap.values()).reduce((sum, ids) => sum + ids.length, 0);
    console.log(`   ✓ Created ${totalVehicles} vehicles`);
    return vehicleMap;
  }

  /**
   * Seed work orders
   */
  private async seedWorkOrders(client: PoolClient): Promise<void> {
    console.log('🔧 Seeding work orders...');
    let totalWorkOrders = 0;

    const tenantIds = await this.getTenantIds(client);

    for (const tenantId of tenantIds) {
      const vehicleIds = await this.getVehicleIds(client, tenantId);
      const mechanicIds = await this.getMechanicIds(client, tenantId);

      for (const vehicleId of vehicleIds) {
        const mechanicId = mechanicIds.length > 0 ? mechanicIds[0] : undefined;
        const workOrders = this.workOrderFactory.buildList(
          tenantId,
          vehicleId,
          this.config.workOrdersPerVehicle,
          mechanicId
        );

        for (const wo of workOrders) {
          await client.query(
            `INSERT INTO work_orders (id, tenant_id, vehicle_id, number, title, type, priority, status, description, assigned_to_id, scheduled_start_date, scheduled_end_date, actual_start_date, actual_end_date, estimated_cost, actual_cost, notes, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
            [
              wo.id,
              wo.tenant_id,
              wo.vehicle_id,
              wo.work_order_number, // Maps to number
              `${wo.type.charAt(0).toUpperCase() + wo.type.slice(1)} Maintenance`, // title
              wo.type,
              wo.priority,
              wo.status,
              wo.description,
              wo.assigned_to, // Maps to assigned_to_id
              wo.scheduled_start, // Maps to scheduled_start_date
              wo.scheduled_end, // Maps to scheduled_end_date
              wo.actual_start, // Maps to actual_start_date
              wo.actual_end, // Maps to actual_end_date
              wo.estimated_cost,
              wo.actual_cost,
              wo.notes,
              wo.created_at,
              wo.updated_at,
            ]
          );
          totalWorkOrders++;
        }
      }
    }

    console.log(`   ✓ Created ${totalWorkOrders} work orders`);
  }

  /**
   * Seed maintenance schedules
   */
  private async seedMaintenanceSchedules(client: PoolClient): Promise<void> {
    console.log('🔨 Seeding maintenance schedules...');
    let totalMaintenance = 0;

    const tenantIds = await this.getTenantIds(client);

    for (const tenantId of tenantIds) {
      const vehicleIds = await this.getVehicleIds(client, tenantId);

      for (const vehicleId of vehicleIds) {
        const schedules = this.maintenanceFactory.buildList(
          tenantId,
          vehicleId,
          this.config.maintenancePerVehicle
        );

        for (const schedule of schedules) {
          await client.query(
            `INSERT INTO maintenance_schedules (id, tenant_id, vehicle_id, type, name, description, next_service_date, last_service_date, last_service_mileage, estimated_cost, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              schedule.id,
              schedule.tenant_id,
              schedule.vehicle_id,
              schedule.type, // Maps to type
              schedule.description, // Maps to name (description is usually short enough)
              schedule.description, // Maps to description
              schedule.scheduled_date, // Maps to next_service_date
              schedule.completed_date, // Maps to last_service_date
              schedule.mileage_at_service, // Maps to last_service_mileage
              schedule.cost, // Maps to estimated_cost
              true, // is_active
              schedule.created_at,
              schedule.updated_at,
            ]
          );
          totalMaintenance++;
        }
      }
    }

    console.log(`   ✓ Created ${totalMaintenance} maintenance schedules`);
  }

  /**
   * Seed fuel transactions
   */
  private async seedFuelTransactions(client: PoolClient): Promise<void> {
    console.log('⛽ Seeding fuel transactions...');
    let totalTransactions = 0;

    const tenantIds = await this.getTenantIds(client);

    for (const tenantId of tenantIds) {
      const vehicles = await this.getVehiclesWithFuelType(client, tenantId);

      // Map User ID to Driver ID
      const driverMapResult = await client.query('SELECT id, user_id FROM drivers WHERE tenant_id = $1', [tenantId]);
      const userToDriverMap = new Map<string, string>();
      for (const row of driverMapResult.rows) {
        if (row.user_id) userToDriverMap.set(row.user_id, row.id);
      }

      for (const vehicle of vehicles) {
        // Resolve Driver ID from User ID
        const driverId = vehicle.assigned_driver_id
          ? (userToDriverMap.get(vehicle.assigned_driver_id) || null)
          : null;

        const transactions = this.fuelFactory.buildList(
          tenantId,
          vehicle.id,
          driverId, // Use Driver ID
          vehicle.fuel_type as any,
          this.config.fuelTransactionsPerVehicle
        );

        for (const tx of transactions) {
          await client.query(
            `INSERT INTO fuel_transactions (id, tenant_id, vehicle_id, driver_id, transaction_date, gallons, cost_per_gallon, total_cost, fuel_type, vendor_name, location, odometer_reading, card_last4, receipt_url, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
            [
              tx.id,
              tx.tenant_id,
              tx.vehicle_id,
              tx.driver_id,
              tx.transaction_date,
              tx.gallons,
              tx.cost_per_gallon,
              tx.total_cost,
              tx.fuel_type,
              tx.vendor, // Maps to vendor_name
              tx.location,
              tx.odometer, // Maps to odometer_reading
              tx.card_number_last_4, // Maps to card_last4
              tx.receipt_url,
              tx.created_at,
            ]
          );
          totalTransactions++;
        }
      }
    }

    console.log(`   ✓ Created ${totalTransactions} fuel transactions`);
  }

  /**
   * Seed routes
   */
  private async seedRoutes(client: PoolClient): Promise<void> {
    console.log('🗺️  Seeding routes...');
    let totalRoutes = 0;

    const tenantIds = await this.getTenantIds(client);

    for (const tenantId of tenantIds) {
      const vehicles = await this.getVehiclesWithDrivers(client, tenantId);

      // Map User ID to Driver ID
      const driverMapResult = await client.query('SELECT id, user_id FROM drivers WHERE tenant_id = $1', [tenantId]);
      const userToDriverMap = new Map<string, string>();
      for (const row of driverMapResult.rows) {
        if (row.user_id) userToDriverMap.set(row.user_id, row.id);
      }

      for (const vehicle of vehicles) {
        // Resolve Driver ID from User ID (vehicle.assigned_driver_id is User ID)
        const driverId = vehicle.assigned_driver_id
          ? (userToDriverMap.get(vehicle.assigned_driver_id) || null)
          : null;

        const routes = this.routeFactory.buildList(
          tenantId,
          vehicle.id,
          driverId, // Use Driver ID
          this.config.routesPerVehicle
        );

        for (const route of routes) {
          await client.query(
            `INSERT INTO routes (id, tenant_id, route_name, vehicle_id, driver_id, status, type, start_location, end_location, planned_start_time, planned_end_time, actual_start_time, actual_end_time, total_distance, estimated_duration, actual_duration, waypoints, optimized_waypoints, route_geometry, notes, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
            [
              route.id,
              route.tenant_id,
              route.route_name,
              route.vehicle_id,
              route.driver_id,
              route.status,
              route.route_type, // Maps to type
              route.start_location,
              route.end_location,
              route.planned_start_time,
              route.planned_end_time,
              route.actual_start_time,
              route.actual_end_time,
              route.total_distance,
              route.estimated_duration,
              route.actual_duration,
              JSON.stringify(route.waypoints),
              route.optimized_waypoints ? JSON.stringify(route.optimized_waypoints) : null,
              JSON.stringify(route.route_geometry),
              route.notes,
              route.created_at,
              route.updated_at,
            ]
          );
          totalRoutes++;
        }
      }
    }

    console.log(`   ✓ Created ${totalRoutes} routes`);
  }

  /**
   * Seed incidents
   */
  private async seedIncidents(client: PoolClient): Promise<void> {
    console.log('⚠️  Seeding incidents...');
    let totalIncidents = 0;

    const tenantIds = await this.getTenantIds(client);

    for (const tenantId of tenantIds) {
      const vehicleIds = await this.getVehicleIds(client, tenantId);
      const driverIds = await this.getDriverIds(client, tenantId);

      const incidents = this.incidentFactory.buildList(
        tenantId,
        this.config.incidentsPerTenant,
        vehicleIds,
        driverIds
      );

      for (const incident of incidents) {
        await client.query(
          `INSERT INTO incidents (id, tenant_id, number, vehicle_id, driver_id, incident_date, severity, type, description, location, latitude, longitude, injuries_reported, fatalities_reported, police_report_number, insurance_claim_number, status, estimated_cost, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
          [
            incident.id,
            incident.tenant_id,
            incident.number,
            incident.vehicle_id,
            incident.driver_id,
            incident.incident_date,
            incident.severity,
            incident.type,
            incident.description,
            incident.location,
            incident.latitude,
            incident.longitude,
            (incident.injuries_count || 0) > 0, // Maps to injuries_reported
            (incident.fatalities_count || 0) > 0, // Maps to fatalities_reported
            incident.police_report_number,
            incident.insurance_claim_number,
            incident.status,
            incident.estimated_cost,
            incident.created_at,
            incident.updated_at,
          ]
        );
        totalIncidents++;
      }
    }

    console.log(`   ✓ Created ${totalIncidents} incidents`);
  }

  /**
   * Seed compliance records
   */
  private async seedComplianceRecords(client: PoolClient): Promise<void> {
    console.log('📜 Seeding compliance records...');
    let totalRecords = 0;

    const tenantIds = await this.getTenantIds(client);

    for (const tenantId of tenantIds) {
      // Driver compliance records
      const driverIds = await this.getDriverIds(client, tenantId);
      for (const driverId of driverIds) {
        const records = this.complianceFactory.buildList(
          tenantId,
          'driver',
          driverId,
          this.config.complianceRecordsPerEntity
        );

        for (const record of records) {
          await client.query(
            `INSERT INTO compliance_records (id, tenant_id, entity_type, entity_id, certification_type, certification_number, issuing_authority, issue_date, expiry_date, status, document_url, notes, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
            [
              record.id,
              record.tenant_id,
              record.entity_type,
              record.entity_id,
              record.certification_type,
              record.certification_number,
              record.issuing_authority,
              record.issue_date,
              record.expiry_date,
              record.status,
              record.document_url,
              record.notes,
              record.created_at,
              record.updated_at,
            ]
          );
          totalRecords++;
        }
      }

      // Vehicle compliance records
      const vehicleIds = await this.getVehicleIds(client, tenantId);
      for (const vehicleId of vehicleIds) {
        const records = this.complianceFactory.buildList(
          tenantId,
          'vehicle',
          vehicleId,
          this.config.complianceRecordsPerEntity
        );

        for (const record of records) {
          await client.query(
            `INSERT INTO compliance_records (id, tenant_id, entity_type, entity_id, certification_type, certification_number, issuing_authority, issue_date, expiry_date, status, document_url, notes, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
            [
              record.id,
              record.tenant_id,
              record.entity_type,
              record.entity_id,
              record.certification_type,
              record.certification_number,
              record.issuing_authority,
              record.issue_date,
              record.expiry_date,
              record.status,
              record.document_url,
              record.notes,
              record.created_at,
              record.updated_at,
            ]
          );
          totalRecords++;
        }
      }
    }

    console.log(`   ✓ Created ${totalRecords} compliance records`);
  }

  // Helper methods to query database
  private async getTenantIds(client: PoolClient): Promise<string[]> {
    const result = await client.query('SELECT id FROM tenants ORDER BY created_at');
    return result.rows.map((row) => row.id);
  }

  private async getDriverUserIds(client: PoolClient, tenantId: string): Promise<string[]> {
    const result = await client.query(
      'SELECT id FROM users WHERE tenant_id = $1 AND role = $2',
      [tenantId, 'Driver']
    );
    return result.rows.map((row) => row.id);
  }

  private async getDriverIds(client: PoolClient, tenantId: string): Promise<string[]> {
    const result = await client.query(
      'SELECT id FROM drivers WHERE tenant_id = $1',
      [tenantId]
    );
    return result.rows.map((row) => row.id);
  }

  private async getMechanicIds(client: PoolClient, tenantId: string): Promise<string[]> {
    const result = await client.query(
      'SELECT id FROM users WHERE tenant_id = $1 AND role = $2',
      [tenantId, 'Mechanic']
    );
    return result.rows.map((row) => row.id);
  }

  private async getVehicleIds(client: PoolClient, tenantId: string): Promise<string[]> {
    const result = await client.query(
      'SELECT id FROM vehicles WHERE tenant_id = $1',
      [tenantId]
    );
    return result.rows.map((row) => row.id);
  }

  private async getVehiclesWithFuelType(
    client: PoolClient,
    tenantId: string
  ): Promise<Array<{ id: string; fuel_type: string; assigned_driver_id: string | null }>> {
    const result = await client.query(
      'SELECT id, fuel_type, assigned_driver_id FROM vehicles WHERE tenant_id = $1',
      [tenantId]
    );
    return result.rows;
  }

  private async getVehiclesWithDrivers(
    client: PoolClient,
    tenantId: string
  ): Promise<Array<{ id: string; assigned_driver_id: string | null }>> {
    const result = await client.query(
      'SELECT id, assigned_driver_id FROM vehicles WHERE tenant_id = $1 AND assigned_driver_id IS NOT NULL',
      [tenantId]
    );
    return result.rows;
  }
}

// CLI execution
if (require.main === module) {
  const { Pool } = require('pg');
  const { config } = require('dotenv');

  config();

  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT || 5432),
  });

  const orchestrator = new SeedOrchestrator(pool);

  const command = process.argv[2] || 'seed';

  if (command === 'reset') {
    orchestrator
      .reset()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
  } else {
    orchestrator
      .seed()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
  }
}
