/**
 * Database-Integrated Fleet Emulator
 *
 * Generates ALL types of real-life events, alerts, and data:
 * - Maintenance schedules and overdue alerts
 * - Safety incidents and violations
 * - Fuel transactions and efficiency warnings
 * - Inspection failures and damage reports
 * - Driver behavior and policy violations
 * - Geofence events and unauthorized usage
 * - Communication logs and notifications
 * - Work orders and purchase orders
 * - Charging sessions (EV vehicles)
 * - Video events and camera alerts
 * - AI anomaly detection
 * - And much more...
 */

import { Pool } from 'pg';
import { EventEmitter } from 'events';

interface VehicleRecord {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  license_plate: string;
  department?: string;
  status: string;
  odometer: number;
  fuel_type?: string;
}

export class DatabaseIntegratedEmulator extends EventEmitter {
  private pool: Pool;
  private vehicles: Map<string, VehicleRecord> = new Map();
  private drivers: Map<string, any> = new Map();
  private isRunning: boolean = false;
  private intervals: NodeJS.Timeout[] = [];

  constructor(private databaseUrl: string) {
    super();
    this.pool = new Pool({
      connectionString: databaseUrl,
      max: 20,
      connectionTimeoutMillis: 10000
    });
  }

  async initialize(): Promise<void> {
    console.log('[DB Emulator] Initializing with existing database...');

    // Load existing vehicles
    await this.loadVehicles();

    // Load or create drivers
    await this.loadDrivers();

    console.log(`[DB Emulator] Loaded ${this.vehicles.size} vehicles and ${this.drivers.size} drivers`);
  }

  private async loadVehicles(): Promise<void> {
    const result = await this.pool.query(`
      SELECT id, make, model, year, vin, license_plate, department, status, odometer, fuel_type
      FROM vehicles
      ORDER BY license_plate
    `);

    result.rows.forEach(row => {
      this.vehicles.set(row.id, row);
    });
  }

  private async loadDrivers(): Promise<void> {
    const result = await this.pool.query(`
      SELECT id, first_name, last_name, email, license_number, department
      FROM drivers
      LIMIT 50
    `);

    if (result.rows.length === 0) {
      // Create sample drivers
      await this.createSampleDrivers();
    } else {
      result.rows.forEach(row => {
        this.drivers.set(row.id, row);
      });
    }
  }

  private async createSampleDrivers(): Promise<void> {
    const firstNames = ['John', 'Sarah', 'Michael', 'Jennifer', 'David', 'Lisa', 'James', 'Mary', 'Robert', 'Patricia'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    const departments = ['police', 'fire', 'publicWorks', 'transit', 'utilities', 'parks'];

    for (let i = 0; i < 30; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@tallahassee.gov`;
      const department = departments[Math.floor(Math.random() * departments.length)];

      const result = await this.pool.query(`
        INSERT INTO drivers (first_name, last_name, email, license_number, phone, department, hire_date, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        firstName,
        lastName,
        email,
        `FL-${String(Math.floor(Math.random() * 999999999)).padStart(9, '0')}`,
        `850-${String(Math.floor(Math.random() * 9999999)).padStart(7, '0')}`,
        department,
        new Date(2018 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 12), 1),
        'active'
      ]);

      this.drivers.set(result.rows[0].id, {
        id: result.rows[0].id,
        first_name: firstName,
        last_name: lastName,
        email,
        department
      });
    }

    console.log(`[DB Emulator] Created ${this.drivers.size} sample drivers`);
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    console.log('[DB Emulator] Starting comprehensive event generation...');
    this.isRunning = true;

    // Schedule different event types at realistic intervals
    this.scheduleMaintenanceAlerts();      // Check every 5 minutes
    this.scheduleSafetyIncidents();        // Random, ~5 per hour across fleet
    this.scheduleFuelTransactions();       // When fuel < 20%
    this.scheduleInspections();            // Daily pre-trip/post-trip
    this.scheduleGeofenceEvents();         // When vehicles move
    this.schedulePolicyViolations();       // Random, ~2 per hour
    this.scheduleDamageReports();          // Random, ~1 per day
    this.scheduleWorkOrders();             // Generated from inspections/incidents
    this.scheduleNotifications();          // Various system notifications
    this.scheduleTelemetryAnomalies();     // AI detection
    this.scheduleCommun icationLogs();      // Driver communications
    this.scheduleVideoEvents();            // Camera-detected events

    console.log('[DB Emulator] All event generators active');
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    await this.pool.end();
  }

  // ========================================
  // MAINTENANCE SCHEDULES & ALERTS
  // ========================================

  private scheduleMaintenanceAlerts(): void {
    const interval = setInterval(async () => {
      if (!this.isRunning) return;

      for (const [vehicleId, vehicle] of this.vehicles) {
        // Check if maintenance is due
        const maintenanceTypes = [
          { type: 'oil_change', interval_miles: 5000, description: 'Oil and Filter Change' },
          { type: 'tire_rotation', interval_miles: 7500, description: 'Tire Rotation and Balance' },
          { type: 'brake_inspection', interval_miles: 15000, description: 'Brake System Inspection' },
          { type: 'annual_inspection', interval_miles: 12000, description: 'Annual Safety Inspection' }
        ];

        for (const maint of maintenanceTypes) {
          // Check if due based on odometer
          const lastMaintResult = await this.pool.query(`
            SELECT MAX(completed_date) as last_completed, MAX(odometer_at_service) as last_odometer
            FROM maintenance_schedules
            WHERE vehicle_id = $1 AND maintenance_type = $2
          `, [vehicleId, maint.type]);

          const lastOdometer = lastMaintResult.rows[0]?.last_odometer || 0;
          const milesSinceLast = vehicle.odometer - lastOdometer;

          if (milesSinceLast >= maint.interval_miles) {
            // Create overdue maintenance alert
            await this.generateMaintenanceAlert(vehicleId, vehicle, maint, milesSinceLast);
          } else if (milesSinceLast >= maint.interval_miles * 0.9) {
            // Create upcoming maintenance notification
            await this.generateMaintenanceReminder(vehicleId, vehicle, maint, maint.interval_miles - milesSinceLast);
          }
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    this.intervals.push(interval);
  }

  private async generateMaintenanceAlert(vehicleId: string, vehicle: VehicleRecord, maint: any, overdueMiles: number): Promise<void> {
    // Insert maintenance notification
    await this.pool.query(`
      INSERT INTO maintenance_notifications (vehicle_id, maintenance_type, priority, message, miles_overdue, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT DO NOTHING
    `, [
      vehicleId,
      maint.type,
      overdueMiles > 1000 ? 'critical' : 'high',
      `${vehicle.make} ${vehicle.model} (${vehicle.license_plate}) is ${overdueMiles} miles overdue for ${maint.description}`,
      overdueMiles
    ]);

    // Create system notification
    await this.pool.query(`
      INSERT INTO notifications (type, severity, title, message, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      'maintenance_overdue',
      overdueMiles > 1000 ? 'critical' : 'warning',
      'Maintenance Overdue',
      `Vehicle ${vehicle.license_plate} requires ${maint.description}`,
      JSON.stringify({ vehicle_id: vehicleId, maintenance_type: maint.type, miles_overdue: overdueMiles })
    ]);

    console.log(`[Maintenance Alert] ${vehicle.license_plate} - ${maint.description} overdue by ${overdueMiles} miles`);
  }

  private async generateMaintenanceReminder(vehicleId: string, vehicle: VehicleRecord, maint: any, milesRemaining: number): Promise<void> {
    await this.pool.query(`
      INSERT INTO notifications (type, severity, title, message, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT DO NOTHING
    `, [
      'maintenance_reminder',
      'info',
      'Upcoming Maintenance',
      `Vehicle ${vehicle.license_plate} needs ${maint.description} in ${milesRemaining} miles`,
      JSON.stringify({ vehicle_id: vehicleId, maintenance_type: maint.type, miles_remaining: milesRemaining })
    ]);
  }

  // ========================================
  // SAFETY INCIDENTS & VIOLATIONS
  // ========================================

  private scheduleSafetyIncidents(): void {
    const interval = setInterval(async () => {
      if (!this.isRunning) return;

      // Generate 0-2 safety incidents per hour across the fleet
      const incidentCount = Math.random() < 0.3 ? (Math.random() < 0.5 ? 1 : 2) : 0;

      for (let i = 0; i < incidentCount; i++) {
        await this.generateSafetyIncident();
      }
    }, 60 * 60 * 1000); // Every hour

    this.intervals.push(interval);
  }

  private async generateSafetyIncident(): Promise<void> {
    const vehicleArray = Array.from(this.vehicles.values());
    const vehicle = vehicleArray[Math.floor(Math.random() * vehicleArray.length)];
    const driverArray = Array.from(this.drivers.values());
    const driver = driverArray[Math.floor(Math.random() * driverArray.length)];

    const incidentTypes = [
      { type: 'speeding', severity: 'moderate', description: 'Exceeding speed limit by 15+ mph' },
      { type: 'harsh_braking', severity: 'minor', description: 'Harsh braking event detected' },
      { type: 'harsh_acceleration', severity: 'minor', description: 'Harsh acceleration detected' },
      { type: 'seatbelt_violation', severity: 'major', description: 'Seatbelt not worn' },
      { type: 'phone_usage', severity: 'major', description: 'Mobile phone usage while driving' },
      { type: 'following_distance', severity: 'moderate', description: 'Following too closely' },
      { type: 'lane_departure', severity: 'moderate', description: 'Lane departure without signal' }
    ];

    const incident = incidentTypes[Math.floor(Math.random() * incidentTypes.length)];

    // Insert safety incident
    const result = await this.pool.query(`
      INSERT INTO safety_incidents (
        vehicle_id, driver_id, incident_type, severity, description,
        latitude, longitude, speed, timestamp, reported_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)
      RETURNING id
    `, [
      vehicle.id,
      driver.id,
      incident.type,
      incident.severity,
      incident.description,
      30.4383 + (Math.random() - 0.5) * 0.2, // Tallahassee
      -84.2807 + (Math.random() - 0.5) * 0.2,
      35 + Math.floor(Math.random() * 40),
      'system'
    ]);

    // Create notification
    await this.pool.query(`
      INSERT INTO notifications (type, severity, title, message, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      'safety_incident',
      incident.severity === 'major' ? 'error' : 'warning',
      'Safety Incident Detected',
      `${incident.description} - Vehicle ${vehicle.license_plate}, Driver ${driver.first_name} ${driver.last_name}`,
      JSON.stringify({ incident_id: result.rows[0].id, vehicle_id: vehicle.id, driver_id: driver.id })
    ]);

    console.log(`[Safety Incident] ${incident.type} - ${vehicle.license_plate} - ${driver.first_name} ${driver.last_name}`);
  }

  // ========================================
  // FUEL TRANSACTIONS
  // ========================================

  private scheduleFuelTransactions(): void {
    const interval = setInterval(async () => {
      if (!this.isRunning) return;

      for (const [vehicleId, vehicle] of this.vehicles) {
        // Check if fuel is low (< 20%) or random refuel
        if (Math.random() < 0.001) { // ~0.1% chance per check = realistic refueling pattern
          await this.generateFuelTransaction(vehicleId, vehicle);
        }
      }
    }, 60 * 1000); // Check every minute

    this.intervals.push(interval);
  }

  private async generateFuelTransaction(vehicleId: string, vehicle: VehicleRecord): Promise<void> {
    const stations = [
      { name: 'City Fuel Depot', lat: 30.4423, lng: -84.2897, card_type: 'fleet_card' },
      { name: 'Shell Monroe St', lat: 30.4401, lng: -84.2812, card_type: 'fleet_card' },
      { name: 'BP Tennessee St', lat: 30.4390, lng: -84.2950, card_type: 'fleet_card' },
      { name: 'Chevron Capital Circle', lat: 30.4350, lng: -84.3100, card_type: 'fleet_card' }
    ];

    const station = stations[Math.floor(Math.random() * stations.length)];
    const fuelType = vehicle.fuel_type || 'diesel';
    const gallons = 15 + Math.random() * 35; // 15-50 gallons
    const pricePerGallon = fuelType === 'diesel' ? 3.45 : 3.15;
    const totalCost = gallons * pricePerGallon;

    await this.pool.query(`
      INSERT INTO fuel_transactions (
        vehicle_id, station_name, fuel_type, gallons, price_per_gallon,
        total_cost, odometer, latitude, longitude, card_type, transaction_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
    `, [
      vehicleId,
      station.name,
      fuelType,
      gallons.toFixed(2),
      pricePerGallon.toFixed(2),
      totalCost.toFixed(2),
      vehicle.odometer,
      station.lat,
      station.lng,
      station.card_type
    ]);

    console.log(`[Fuel Transaction] ${vehicle.license_plate} - ${gallons.toFixed(1)} gal at ${station.name} - $${totalCost.toFixed(2)}`);
  }

  // ========================================
  // VEHICLE INSPECTIONS
  // ========================================

  private scheduleInspections(): void {
    const interval = setInterval(async () => {
      if (!this.isRunning) return;

      // Generate pre-trip and post-trip inspections
      const inspectionCount = Math.floor(Math.random() * 10) + 5; // 5-15 inspections per interval

      for (let i = 0; i < inspectionCount; i++) {
        await this.generateInspection();
      }
    }, 2 * 60 * 60 * 1000); // Every 2 hours

    this.intervals.push(interval);
  }

  private async generateInspection(): Promise<void> {
    const vehicleArray = Array.from(this.vehicles.values());
    const vehicle = vehicleArray[Math.floor(Math.random() * vehicleArray.length)];
    const driverArray = Array.from(this.drivers.values());
    const driver = driverArray[Math.floor(Math.random() * driverArray.length)];

    const inspectionType = Math.random() < 0.5 ? 'pre_trip' : 'post_trip';
    const passed = Math.random() > 0.15; // 85% pass rate

    const defects = [];
    if (!passed) {
      const possibleDefects = [
        'Low tire pressure - front left',
        'Brake warning light on',
        'Windshield wiper not functioning',
        'Headlight bulb out - right side',
        'Fluid leak observed',
        'Check engine light illuminated',
        'Mirror damaged',
        'Horn not working'
      ];

      const defectCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < defectCount; i++) {
        defects.push(possibleDefects[Math.floor(Math.random() * possibleDefects.length)]);
      }
    }

    const result = await this.pool.query(`
      INSERT INTO vehicle_inspections (
        vehicle_id, driver_id, inspection_type, passed, defects_found,
        odometer, notes, inspection_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id
    `, [
      vehicle.id,
      driver.id,
      inspectionType,
      passed,
      JSON.stringify(defects),
      vehicle.odometer,
      passed ? 'All systems operational' : 'Defects identified - see list'
    ]);

    if (!passed) {
      // Create notification for failed inspection
      await this.pool.query(`
        INSERT INTO notifications (type, severity, title, message, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [
        'inspection_failed',
        'warning',
        'Vehicle Inspection Failed',
        `${vehicle.license_plate} failed ${inspectionType.replace('_', '-')} inspection - ${defects.length} defect(s) found`,
        JSON.stringify({ inspection_id: result.rows[0].id, vehicle_id: vehicle.id, defects })
      ]);

      // Create work order for repairs
      await this.generateWorkOrder(vehicle.id, `Repair defects from ${inspectionType} inspection`, defects.join(', '));
    }

    console.log(`[Inspection] ${vehicle.license_plate} - ${inspectionType} - ${passed ? 'PASSED' : 'FAILED'}`);
  }

  // ========================================
  // WORK ORDERS
  // ========================================

  private scheduleWorkOrders(): void {
    // Work orders are generated from other events (inspections, incidents, etc.)
    // This is just a periodic check for scheduled maintenance work orders
    const interval = setInterval(async () => {
      if (!this.isRunning) return;

      // Generate 1-3 scheduled maintenance work orders
      const count = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < count; i++) {
        const vehicleArray = Array.from(this.vehicles.values());
        const vehicle = vehicleArray[Math.floor(Math.random() * vehicleArray.length)];

        const maintenanceTypes = [
          'Oil and filter change',
          'Tire rotation and balance',
          'Brake pad replacement',
          'Battery replacement',
          'Coolant flush',
          'Air filter replacement'
        ];

        const workType = maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)];
        await this.generateWorkOrder(vehicle.id, workType, `Scheduled maintenance: ${workType}`);
      }
    }, 4 * 60 * 60 * 1000); // Every 4 hours

    this.intervals.push(interval);
  }

  private async generateWorkOrder(vehicleId: string, title: string, description: string): Promise<void> {
    const priority = Math.random() < 0.2 ? 'high' : (Math.random() < 0.5 ? 'medium' : 'low');
    const status = Math.random() < 0.3 ? 'in_progress' : 'pending';

    await this.pool.query(`
      INSERT INTO work_orders (
        vehicle_id, title, description, priority, status,
        estimated_cost, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [
      vehicleId,
      title,
      description,
      priority,
      status,
      50 + Math.random() * 500 // $50-$550
    ]);

    console.log(`[Work Order] ${title} - ${priority} priority`);
  }

  // ========================================
  // GEOFENCE EVENTS
  // ========================================

  private scheduleGeofenceEvents(): void {
    const interval = setInterval(async () => {
      if (!this.isRunning) return;

      // Random geofence violations
      if (Math.random() < 0.1) { // 10% chance per interval
        await this.generateGeofenceEvent();
      }
    }, 15 * 60 * 1000); // Every 15 minutes

    this.intervals.push(interval);
  }

  private async generateGeofenceEvent(): Promise<void> {
    const vehicleArray = Array.from(this.vehicles.values());
    const vehicle = vehicleArray[Math.floor(Math.random() * vehicleArray.length)];

    const eventTypes = ['entered', 'exited'];
    const geofences = [
      { name: 'City Limits', type: 'boundary' },
      { name: 'Restricted Area - Construction Zone', type: 'restricted' },
      { name: 'High Priority Zone - Downtown', type: 'priority' }
    ];

    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const geofence = geofences[Math.floor(Math.random() * geofences.length)];

    await this.pool.query(`
      INSERT INTO geofence_events (
        vehicle_id, geofence_name, event_type, latitude, longitude, timestamp
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      vehicle.id,
      geofence.name,
      eventType,
      30.4383 + (Math.random() - 0.5) * 0.2,
      -84.2807 + (Math.random() - 0.5) * 0.2
    ]);

    if (geofence.type === 'restricted') {
      await this.pool.query(`
        INSERT INTO notifications (type, severity, title, message, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [
        'geofence_violation',
        'warning',
        'Geofence Violation',
        `Vehicle ${vehicle.license_plate} ${eventType} ${geofence.name}`,
        JSON.stringify({ vehicle_id: vehicle.id, geofence_name: geofence.name })
      ]);
    }

    console.log(`[Geofence] ${vehicle.license_plate} ${eventType} ${geofence.name}`);
  }

  // ========================================
  // POLICY VIOLATIONS
  // ========================================

  private schedulePolicyViolations(): void {
    const interval = setInterval(async () => {
      if (!this.isRunning) return;

      if (Math.random() < 0.05) { // 5% chance per interval
        await this.generatePolicyViolation();
      }
    }, 60 * 60 * 1000); // Every hour

    this.intervals.push(interval);
  }

  private async generatePolicyViolation(): Promise<void> {
    const vehicleArray = Array.from(this.vehicles.values());
    const vehicle = vehicleArray[Math.floor(Math.random() * vehicleArray.length)];
    const driverArray = Array.from(this.drivers.values());
    const driver = driverArray[Math.floor(Math.random() * driverArray.length)];

    const violations = [
      { type: 'unauthorized_personal_use', severity: 'major', description: 'Vehicle used for personal purposes without authorization' },
      { type: 'after_hours_usage', severity: 'moderate', description: 'Vehicle operated outside of authorized hours' },
      { type: 'unauthorized_passenger', severity: 'minor', description: 'Unauthorized passenger detected' },
      { type: 'route_deviation', severity: 'minor', description: 'Significant deviation from assigned route' }
    ];

    const violation = violations[Math.floor(Math.random() * violations.length)];

    await this.pool.query(`
      INSERT INTO policy_violations (
        vehicle_id, driver_id, violation_type, severity, description,
        latitude, longitude, violation_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [
      vehicle.id,
      driver.id,
      violation.type,
      violation.severity,
      violation.description,
      30.4383 + (Math.random() - 0.5) * 0.2,
      -84.2807 + (Math.random() - 0.5) * 0.2
    ]);

    await this.pool.query(`
      INSERT INTO notifications (type, severity, title, message, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      'policy_violation',
      violation.severity === 'major' ? 'error' : 'warning',
      'Policy Violation',
      `${violation.description} - ${vehicle.license_plate} - ${driver.first_name} ${driver.last_name}`,
      JSON.stringify({ vehicle_id: vehicle.id, driver_id: driver.id, violation_type: violation.type })
    ]);

    console.log(`[Policy Violation] ${violation.type} - ${vehicle.license_plate}`);
  }

  // ========================================
  // DAMAGE REPORTS
  // ========================================

  private scheduleDamageReports(): void {
    const interval = setInterval(async () => {
      if (!this.isRunning) return;

      if (Math.random() < 0.02) { // 2% chance per interval
        await this.generateDamageReport();
      }
    }, 24 * 60 * 60 * 1000); // Once per day

    this.intervals.push(interval);
  }

  private async generateDamageReport(): Promise<void> {
    const vehicleArray = Array.from(this.vehicles.values());
    const vehicle = vehicleArray[Math.floor(Math.random() * vehicleArray.length)];
    const driverArray = Array.from(this.drivers.values());
    const driver = driverArray[Math.floor(Math.random() * driverArray.length)];

    const damageTypes = [
      { type: 'scratch', severity: 'minor', location: 'front bumper', estimated_cost: 250 },
      { type: 'dent', severity: 'moderate', location: 'driver door', estimated_cost: 800 },
      { type: 'cracked_windshield', severity: 'moderate', location: 'windshield', estimated_cost: 400 },
      { type: 'tire_damage', severity: 'minor', location: 'front left tire', estimated_cost: 200 },
      { type: 'mirror_broken', severity: 'moderate', location: 'passenger mirror', estimated_cost: 350 }
    ];

    const damage = damageTypes[Math.floor(Math.random() * damageTypes.length)];

    await this.pool.query(`
      INSERT INTO damage_reports (
        vehicle_id, driver_id, damage_type, severity, location,
        description, estimated_cost, reported_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [
      vehicle.id,
      driver.id,
      damage.type,
      damage.severity,
      damage.location,
      `${damage.type.replace('_', ' ')} on ${damage.location}`,
      damage.estimated_cost
    ]);

    await this.pool.query(`
      INSERT INTO notifications (type, severity, title, message, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      'damage_report',
      'warning',
      'Vehicle Damage Reported',
      `${damage.type.replace('_', ' ')} reported on ${vehicle.license_plate} - Est. cost: $${damage.estimated_cost}`,
      JSON.stringify({ vehicle_id: vehicle.id, damage_type: damage.type })
    ]);

    console.log(`[Damage Report] ${damage.type} on ${vehicle.license_plate} - $${damage.estimated_cost}`);
  }

  // ========================================
  // NOTIFICATIONS & ALERTS
  // ========================================

  private scheduleNotifications(): void {
    const interval = setInterval(async () => {
      if (!this.isRunning) return;

      // Generate various system notifications
      if (Math.random() < 0.1) {
        await this.generateSystemNotification();
      }
    }, 30 * 60 * 1000); // Every 30 minutes

    this.intervals.push(interval);
  }

  private async generateSystemNotification(): Promise<void> {
    const notifications = [
      { type: 'system_update', severity: 'info', title: 'System Update Available', message: 'Fleet management system update available for installation' },
      { type: 'license_expiring', severity: 'warning', title: 'License Expiring', message: 'Driver license expiring in 30 days' },
      { type: 'insurance_renewal', severity: 'info', title: 'Insurance Renewal', message: 'Vehicle insurance renewal due next month' },
      { type: 'registration_due', severity: 'warning', title: 'Registration Due', message: 'Vehicle registration renewal required' }
    ];

    const notif = notifications[Math.floor(Math.random() * notifications.length)];

    await this.pool.query(`
      INSERT INTO notifications (type, severity, title, message, created_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, [notif.type, notif.severity, notif.title, notif.message]);

    console.log(`[Notification] ${notif.title}`);
  }

  // ========================================
  // TELEMETRY ANOMALIES (AI Detection)
  // ========================================

  private scheduleTelemetryAnomalies(): void {
    const interval = setInterval(async () => {
      if (!this.isRunning) return;

      if (Math.random() < 0.05) {
        await this.generateTelemetryAnomaly();
      }
    }, 60 * 60 * 1000); // Every hour

    this.intervals.push(interval);
  }

  private async generateTelemetryAnomaly(): Promise<void> {
    const vehicleArray = Array.from(this.vehicles.values());
    const vehicle = vehicleArray[Math.floor(Math.random() * vehicleArray.length)];

    const anomalyTypes = [
      { type: 'unusual_fuel_consumption', description: 'Fuel consumption rate 40% higher than baseline', severity: 'moderate' },
      { type: 'engine_temperature_spike', description: 'Engine temperature exceeded normal range', severity: 'high' },
      { type: 'battery_voltage_fluctuation', description: 'Abnormal battery voltage fluctuations detected', severity: 'moderate' },
      { type: 'idle_time_excessive', description: 'Idle time exceeds policy threshold', severity: 'low' }
    ];

    const anomaly = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];

    await this.pool.query(`
      INSERT INTO notifications (type, severity, title, message, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      'ai_anomaly',
      anomaly.severity === 'high' ? 'error' : 'warning',
      'AI Anomaly Detected',
      `${anomaly.description} - Vehicle ${vehicle.license_plate}`,
      JSON.stringify({ vehicle_id: vehicle.id, anomaly_type: anomaly.type })
    ]);

    console.log(`[AI Anomaly] ${anomaly.type} - ${vehicle.license_plate}`);
  }

  // ========================================
  // COMMUNICATION LOGS
  // ========================================

  private scheduleCommunicationLogs(): void {
    const interval = setInterval(async () => {
      if (!this.isRunning) return;

      // Generate 2-5 communication logs per interval
      const count = Math.floor(Math.random() * 4) + 2;
      for (let i = 0; i < count; i++) {
        await this.generateCommunicationLog();
      }
    }, 3 * 60 * 60 * 1000); // Every 3 hours

    this.intervals.push(interval);
  }

  private async generateCommunicationLog(): Promise<void> {
    const driverArray = Array.from(this.drivers.values());
    const driver = driverArray[Math.floor(Math.random() * driverArray.length)];

    const messageTypes = [
      'Dispatch confirmation received',
      'ETA update sent to dispatcher',
      'Break time logged',
      'Route completion confirmed',
      'Special instructions acknowledged',
      'Equipment malfunction reported',
      'Customer service inquiry handled'
    ];

    const message = messageTypes[Math.floor(Math.random() * messageTypes.length)];

    await this.pool.query(`
      INSERT INTO communication_logs (sender_type, sender_id, message, timestamp)
      VALUES ($1, $2, $3, NOW())
    `, ['driver', driver.id, message]);

    console.log(`[Communication] ${driver.first_name} ${driver.last_name}: ${message}`);
  }

  // ========================================
  // VIDEO EVENTS (Camera Detections)
  // ========================================

  private scheduleVideoEvents(): void {
    const interval = setInterval(async () => {
      if (!this.isRunning) return;

      if (Math.random() < 0.1) {
        await this.generateVideoEvent();
      }
    }, 60 * 60 * 1000); // Every hour

    this.intervals.push(interval);
  }

  private async generateVideoEvent(): Promise<void> {
    const vehicleArray = Array.from(this.vehicles.values());
    const vehicle = vehicleArray[Math.floor(Math.random() * vehicleArray.length)];

    const eventTypes = [
      { type: 'hard_braking', description: 'Hard braking event captured on dashcam', severity: 'moderate' },
      { type: 'near_collision', description: 'Near collision event detected by AI', severity: 'high' },
      { type: 'lane_departure', description: 'Lane departure without signal detected', severity: 'moderate' },
      { type: 'distracted_driving', description: 'Driver distraction detected by cabin camera', severity: 'high' }
    ];

    const event = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    await this.pool.query(`
      INSERT INTO video_events (
        vehicle_id, event_type, description, severity,
        latitude, longitude, video_url, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [
      vehicle.id,
      event.type,
      event.description,
      event.severity,
      30.4383 + (Math.random() - 0.5) * 0.2,
      -84.2807 + (Math.random() - 0.5) * 0.2,
      `/video/events/${vehicle.id}/${Date.now()}.mp4`
    ]);

    await this.pool.query(`
      INSERT INTO notifications (type, severity, title, message, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      'video_event',
      event.severity === 'high' ? 'error' : 'warning',
      'Video Event Detected',
      `${event.description} - Vehicle ${vehicle.license_plate}`,
      JSON.stringify({ vehicle_id: vehicle.id, event_type: event.type })
    ]);

    console.log(`[Video Event] ${event.type} - ${vehicle.license_plate}`);
  }
}

export default DatabaseIntegratedEmulator;
