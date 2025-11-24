import { Pool } from 'pg';

const pool = new Pool({
    host: process.env.DB_HOST || 'fleet-postgres-service',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'fleetdb',
    user: process.env.DB_USERNAME || 'fleetadmin',
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

interface Vehicle {
    id: string;
    vin: string;
    make: string;
    model: string;
    year: number;
    fuel_type: string;
    fuel_level: number;
    odometer: number;
    latitude: number;
    longitude: number;
    speed: number;
}

class EnhancedFleetEmulator {
    private vehicles: Map<string, Vehicle> = new Map();
    private smartcarVehicles: string[] = [];
    private runningTrips: Map<string, string> = new Map(); // vehicle_id -> trip_id

    async initialize() {
        console.log('🚗 Enhanced Fleet Emulator Starting...');

        await this.loadVehicles();
        await this.loadSmartCarVehicles();
        await this.seedInitialData();

        // Start emulation loops
        this.startMaintenanceEmulation();
        this.startFuelTrackingEmulation();
        this.startTripEmulation();
        this.startSmartCarEmulation();
        this.startAlertsEmulation();

        console.log('✅ Enhanced Fleet Emulator Running');
        console.log(`📊 Tracking ${this.vehicles.size} vehicles`);
        console.log(`🚘 SmartCar API: ${this.smartcarVehicles.length} connected vehicles`);
    }

    private async loadVehicles() {
        const result = await pool.query(`
            SELECT id, vin, make, model, year, fuel_type,
                   COALESCE(fuel_level, 75.0) as fuel_level,
                   COALESCE(odometer, 50000) as odometer,
                   COALESCE(latitude, 30.4383) as latitude,
                   COALESCE(longitude, -84.2807) as longitude,
                   COALESCE(speed, 0) as speed
            FROM vehicles
            WHERE status = 'active'
            LIMIT 200
        `);

        result.rows.forEach((row: Vehicle) => {
            this.vehicles.set(row.id, row);
        });

        console.log(`📋 Loaded ${this.vehicles.size} vehicles`);
    }

    private async loadSmartCarVehicles() {
        const result = await pool.query(`
            SELECT vehicle_id, smartcar_id
            FROM smartcar_vehicles
            WHERE connection_status = 'connected'
        `);

        this.smartcarVehicles = result.rows.map(row => row.vehicle_id);
        console.log(`🔗 SmartCar: ${this.smartcarVehicles.length} vehicles connected`);
    }

    private async seedInitialData() {
        console.log('🌱 Seeding initial tracking data...');

        // Create driver assignments for all active vehicles
        await pool.query(`
            INSERT INTO driver_assignments (vehicle_id, driver_id, assignment_type)
            SELECT v.id, d.id, 'permanent'
            FROM vehicles v
            CROSS JOIN LATERAL (
                SELECT id FROM drivers
                WHERE status = 'active'
                ORDER BY RANDOM()
                LIMIT 1
            ) d
            WHERE v.status = 'active'
            AND NOT EXISTS (
                SELECT 1 FROM driver_assignments da
                WHERE da.vehicle_id = v.id AND da.status = 'active'
            )
            LIMIT 200
        `);

        // Create maintenance schedules for next 6 months
        const maintenanceTypes = [
            { type: 'Oil Change', cost: 75, interval: 5000 },
            { type: 'Tire Rotation', cost: 50, interval: 7500 },
            { type: 'State Inspection', cost: 40, interval: 12000 },
            { type: 'Brake Inspection', cost: 120, interval: 15000 },
            { type: 'Transmission Service', cost: 200, interval: 30000 }
        ];

        for (const [vehicleId, vehicle] of this.vehicles) {
            for (const maint of maintenanceTypes) {
                const dueIn = Math.floor(Math.random() * 180); // 0-180 days
                await pool.query(`
                    INSERT INTO maintenance_schedules
                    (vehicle_id, service_type, scheduled_date, due_mileage, estimated_cost, status, priority)
                    VALUES ($1, $2, CURRENT_DATE + $3, $4, $5, $6, $7)
                    ON CONFLICT DO NOTHING
                `, [
                    vehicleId,
                    maint.type,
                    dueIn,
                    vehicle.odometer + maint.interval,
                    maint.cost,
                    dueIn < 14 ? 'overdue' : 'scheduled',
                    dueIn < 14 ? 'high' : 'normal'
                ]);
            }
        }

        console.log('✅ Initial data seeded');
    }

    // MAINTENANCE EMULATION
    private startMaintenanceEmulation() {
        // Check for overdue maintenance every hour
        setInterval(async () => {
            try {
                // Mark overdue maintenance
                await pool.query(`
                    UPDATE maintenance_schedules
                    SET status = 'overdue', priority = 'high'
                    WHERE scheduled_date < CURRENT_DATE
                    AND status = 'scheduled'
                `);

                // Randomly complete some maintenance (simulate shop visits)
                const vehicles = Array.from(this.vehicles.keys());
                const randomVehicle = vehicles[Math.floor(Math.random() * vehicles.length)];

                const pending = await pool.query(`
                    SELECT id, service_type, estimated_cost
                    FROM maintenance_schedules
                    WHERE vehicle_id = $1 AND status IN ('scheduled', 'overdue')
                    ORDER BY RANDOM()
                    LIMIT 1
                `, [randomVehicle]);

                if (pending.rows.length > 0) {
                    const schedule = pending.rows[0];
                    const actualCost = schedule.estimated_cost * (0.9 + Math.random() * 0.3);

                    // Complete the maintenance
                    await pool.query(`
                        UPDATE maintenance_schedules
                        SET status = 'completed', updated_at = NOW()
                        WHERE id = $1
                    `, [schedule.id]);

                    // Add to history
                    await pool.query(`
                        INSERT INTO maintenance_history
                        (vehicle_id, service_type, service_date, odometer_reading, cost, vendor, technician)
                        VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6)
                    `, [
                        randomVehicle,
                        schedule.service_type,
                        this.vehicles.get(randomVehicle)?.odometer || 50000,
                        actualCost,
                        'City Fleet Maintenance',
                        'Tech-' + Math.floor(Math.random() * 20 + 1)
                    ]);

                    console.log(`🔧 Completed ${schedule.service_type} for vehicle ${randomVehicle.substring(0, 8)}`);
                }
            } catch (error) {
                console.error('Maintenance emulation error:', error);
            }
        }, 60000); // Every minute
    }

    // FUEL TRACKING EMULATION
    private startFuelTrackingEmulation() {
        setInterval(async () => {
            try {
                for (const [vehicleId, vehicle] of this.vehicles) {
                    // Consume fuel based on activity
                    let consumption = 0;

                    if (vehicle.speed > 0) {
                        // Driving - consume fuel
                        if (vehicle.fuel_type === 'Electric' || vehicle.fuel_type === 'Hybrid') {
                            consumption = 0.3 + Math.random() * 0.2; // 0.3-0.5% per update
                        } else {
                            consumption = 0.5 + Math.random() * 0.5; // 0.5-1.0% per update
                        }
                    } else {
                        // Idle - minimal consumption
                        consumption = 0.05 + Math.random() * 0.05; // 0.05-0.1%
                    }

                    vehicle.fuel_level = Math.max(0, vehicle.fuel_level - consumption);

                    // Refuel if below 20%
                    if (vehicle.fuel_level < 20) {
                        const fuelAdded = 100 - vehicle.fuel_level;
                        vehicle.fuel_level = 100;

                        // Log fuel transaction
                        const pricePerUnit = vehicle.fuel_type === 'Electric' ? 0.13 :
                                           vehicle.fuel_type === 'Diesel' ? 4.20 :
                                           vehicle.fuel_type === 'CNG' ? 2.50 : 3.80;

                        await pool.query(`
                            INSERT INTO fuel_transactions
                            (vehicle_id, fuel_type, quantity, unit_price, total_cost,
                             odometer_reading, location, latitude, longitude, vendor)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        `, [
                            vehicleId,
                            vehicle.fuel_type,
                            fuelAdded,
                            pricePerUnit,
                            fuelAdded * pricePerUnit,
                            vehicle.odometer,
                            'City Fleet Fuel Station',
                            vehicle.latitude,
                            vehicle.longitude,
                            'City Fuel Depot'
                        ]);

                        console.log(`⛽ Refueled ${vehicle.make} ${vehicle.model} (${vehicle.fuel_type}): +${fuelAdded.toFixed(1)}%`);
                    }

                    // Update vehicle fuel level
                    await pool.query(`
                        UPDATE vehicles
                        SET fuel_level = $1
                        WHERE id = $2
                    `, [vehicle.fuel_level, vehicleId]);
                }
            } catch (error) {
                console.error('Fuel tracking error:', error);
            }
        }, 10000); // Every 10 seconds
    }

    // TRIP EMULATION
    private startTripEmulation() {
        setInterval(async () => {
            try {
                for (const [vehicleId, vehicle] of this.vehicles) {
                    // 30% chance to start a new trip if not already on one
                    if (!this.runningTrips.has(vehicleId) && Math.random() < 0.3) {
                        await this.startTrip(vehicleId, vehicle);
                    }

                    // If on a trip, record breadcrumbs and maybe end trip
                    if (this.runningTrips.has(vehicleId)) {
                        await this.recordBreadcrumb(vehicleId, vehicle);

                        // 10% chance to end trip
                        if (Math.random() < 0.1) {
                            await this.endTrip(vehicleId, vehicle);
                        }
                    }
                }
            } catch (error) {
                console.error('Trip emulation error:', error);
            }
        }, 15000); // Every 15 seconds
    }

    private async startTrip(vehicleId: string, vehicle: Vehicle) {
        const result = await pool.query(`
            INSERT INTO trip_history
            (vehicle_id, driver_id, trip_start, start_latitude, start_longitude,
             start_odometer, purpose)
            SELECT $1, da.driver_id, NOW(), $2, $3, $4, $5
            FROM driver_assignments da
            WHERE da.vehicle_id = $1 AND da.status = 'active'
            LIMIT 1
            RETURNING id
        `, [
            vehicleId,
            vehicle.latitude,
            vehicle.longitude,
            vehicle.odometer,
            ['Patrol', 'Response', 'Maintenance', 'Administrative'][Math.floor(Math.random() * 4)]
        ]);

        if (result.rows.length > 0) {
            this.runningTrips.set(vehicleId, result.rows[0].id);
            console.log(`🚦 Started trip for ${vehicle.make} ${vehicle.model}`);
        }
    }

    private async recordBreadcrumb(vehicleId: string, vehicle: Vehicle) {
        const tripId = this.runningTrips.get(vehicleId);
        if (!tripId) return;

        await pool.query(`
            INSERT INTO gps_breadcrumbs
            (vehicle_id, trip_id, timestamp, latitude, longitude, speed, heading)
            VALUES ($1, $2, NOW(), $3, $4, $5, $6)
        `, [vehicleId, tripId, vehicle.latitude, vehicle.longitude, vehicle.speed, Math.random() * 360]);
    }

    private async endTrip(vehicleId: string, vehicle: Vehicle) {
        const tripId = this.runningTrips.get(vehicleId);
        if (!tripId) return;

        const distance = 5 + Math.random() * 50; // 5-55 miles
        const duration = 15 + Math.random() * 120; // 15-135 minutes

        await pool.query(`
            UPDATE trip_history
            SET trip_end = NOW(),
                end_latitude = $1,
                end_longitude = $2,
                end_odometer = $3,
                distance_miles = $4,
                duration_minutes = $5,
                avg_speed = $6,
                max_speed = $7,
                fuel_consumed = $8,
                idle_time_minutes = $9
            WHERE id = $10
        `, [
            vehicle.latitude,
            vehicle.longitude,
            vehicle.odometer + Math.floor(distance),
            distance,
            duration,
            (distance / duration) * 60,
            35 + Math.random() * 30,
            distance * 0.05, // gallons or kWh
            Math.floor(duration * 0.15), // 15% idle time
            tripId
        ]);

        // Update vehicle odometer
        vehicle.odometer += Math.floor(distance);
        await pool.query(`UPDATE vehicles SET odometer = $1 WHERE id = $2`, [vehicle.odometer, vehicleId]);

        this.runningTrips.delete(vehicleId);
        console.log(`🏁 Ended trip: ${distance.toFixed(1)} miles in ${duration.toFixed(0)} min`);
    }

    // SMARTCAR API EMULATION
    private startSmartCarEmulation() {
        setInterval(async () => {
            try {
                for (const vehicleId of this.smartcarVehicles) {
                    const vehicle = this.vehicles.get(vehicleId);
                    if (!vehicle) continue;

                    const isEV = vehicle.fuel_type === 'Electric';

                    await pool.query(`
                        INSERT INTO smartcar_telemetry
                        (smartcar_vehicle_id, odometer, fuel_percent, fuel_range_miles,
                         battery_percent, battery_range_miles,
                         tire_pressure_front_left, tire_pressure_front_right,
                         tire_pressure_rear_left, tire_pressure_rear_right,
                         engine_oil_life_percent, latitude, longitude, speed, heading,
                         is_charging, charge_state)
                        SELECT
                            sv.id, $1, $2, $3, $4, $5,
                            32.0 + random() * 3, 32.0 + random() * 3,
                            32.0 + random() * 3, 32.0 + random() * 3,
                            CASE WHEN $6 THEN NULL ELSE 50 + random() * 50 END,
                            $7, $8, $9, random() * 360,
                            CASE WHEN $6 AND $2 < 90 AND random() < 0.3 THEN true ELSE false END,
                            CASE WHEN $6 THEN
                                CASE WHEN $2 >= 95 THEN 'FULLY_CHARGED'
                                     WHEN $2 < 90 AND random() < 0.3 THEN 'CHARGING'
                                     ELSE 'NOT_CHARGING' END
                            ELSE 'NOT_CHARGING' END
                        FROM smartcar_vehicles sv
                        WHERE sv.vehicle_id = $10
                    `, [
                        vehicle.odometer,
                        vehicle.fuel_level,
                        vehicle.fuel_level * 2.5, // Approximate range
                        isEV ? vehicle.fuel_level : null,
                        isEV ? vehicle.fuel_level * 3 : null,
                        isEV,
                        vehicle.latitude,
                        vehicle.longitude,
                        vehicle.speed,
                        vehicleId
                    ]);
                }

                // Update connection status
                await pool.query(`
                    UPDATE smartcar_vehicles
                    SET last_data_update = NOW()
                    WHERE vehicle_id = ANY($1)
                `, [this.smartcarVehicles]);

            } catch (error) {
                console.error('SmartCar emulation error:', error);
            }
        }, 30000); // Every 30 seconds
    }

    // ALERTS EMULATION
    private startAlertsEmulation() {
        setInterval(async () => {
            try {
                // Check for low fuel
                await pool.query(`
                    INSERT INTO fleet_alerts
                    (vehicle_id, alert_type, severity, title, message, metadata)
                    SELECT
                        v.id,
                        'low_fuel',
                        CASE WHEN v.fuel_level < 10 THEN 'critical'
                             WHEN v.fuel_level < 20 THEN 'warning'
                             ELSE 'info' END,
                        'Low Fuel Alert',
                        'Fuel level at ' || ROUND(v.fuel_level, 1) || '%',
                        jsonb_build_object('fuel_level', v.fuel_level, 'make', v.make, 'model', v.model)
                    FROM vehicles v
                    WHERE v.fuel_level < 25
                    AND v.status = 'active'
                    AND NOT EXISTS (
                        SELECT 1 FROM fleet_alerts fa
                        WHERE fa.vehicle_id = v.id
                        AND fa.alert_type = 'low_fuel'
                        AND fa.status = 'active'
                        AND fa.triggered_at > NOW() - INTERVAL '1 hour'
                    )
                `);

                // Check for overdue maintenance
                await pool.query(`
                    INSERT INTO fleet_alerts
                    (vehicle_id, alert_type, severity, title, message, metadata)
                    SELECT
                        ms.vehicle_id,
                        'maintenance_due',
                        CASE WHEN ms.priority = 'critical' THEN 'critical'
                             WHEN ms.priority = 'high' THEN 'warning'
                             ELSE 'info' END,
                        ms.service_type || ' Due',
                        'Scheduled for ' || ms.scheduled_date::text,
                        jsonb_build_object('service_type', ms.service_type, 'due_date', ms.scheduled_date)
                    FROM maintenance_schedules ms
                    WHERE ms.status IN ('overdue', 'scheduled')
                    AND ms.scheduled_date <= CURRENT_DATE + 7
                    AND NOT EXISTS (
                        SELECT 1 FROM fleet_alerts fa
                        WHERE fa.vehicle_id = ms.vehicle_id
                        AND fa.alert_type = 'maintenance_due'
                        AND fa.metadata->>'service_type' = ms.service_type
                        AND fa.status = 'active'
                    )
                `);

                console.log('🔔 Alerts system checked');

            } catch (error) {
                console.error('Alerts emulation error:', error);
            }
        }, 60000); // Every minute
    }
}

// Start the emulator
const emulator = new EnhancedFleetEmulator();
emulator.initialize().catch(console.error);

// Keep process alive
process.on('SIGTERM', () => {
    console.log('👋 Shutting down Enhanced Fleet Emulator...');
    process.exit(0);
});
