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
    private smartcarVehicles: Map<string, string> = new Map(); // vehicle_id -> smartcar_vehicle_id
    private runningTrips: Map<string, string> = new Map(); // vehicle_id -> trip_id

    async initialize() {
        console.log('🚗 Enhanced Fleet Emulator Starting...');

        await this.loadVehicles();
        await this.loadSmartCarVehicles();

        // Start emulation loops
        this.startFuelTrackingEmulation();
        this.startTripEmulation();
        this.startSmartCarEmulation();
        this.startAlertsEmulation();

        console.log('✅ Enhanced Fleet Emulator Running');
        console.log(`📊 Tracking ${this.vehicles.size} vehicles`);
        console.log(`🚘 SmartCar API: ${this.smartcarVehicles.size} connected vehicles`);

        // Keep process alive
        setInterval(() => {
            console.log(`💓 Emulator heartbeat - ${this.vehicles.size} vehicles, ${this.runningTrips.size} active trips`);
        }, 300000); // Every 5 minutes
    }

    private async loadVehicles() {
        const result = await pool.query(`
            SELECT id, vin, make, model, year, fuel_type,
                   COALESCE(fuel_level, 75.0) as fuel_level,
                   COALESCE(odometer::numeric, 50000) as odometer,
                   COALESCE(latitude, 30.4383) as latitude,
                   COALESCE(longitude, -84.2807) as longitude,
                   COALESCE(speed, 0) as speed
            FROM vehicles
            WHERE status = 'active'
            LIMIT 200
        `);

        result.rows.forEach((row: any) => {
            this.vehicles.set(row.id, {
                ...row,
                fuel_level: parseFloat(row.fuel_level),
                odometer: parseInt(row.odometer),
                latitude: parseFloat(row.latitude),
                longitude: parseFloat(row.longitude),
                speed: parseFloat(row.speed)
            });
        });

        console.log(`📋 Loaded ${this.vehicles.size} vehicles`);
    }

    private async loadSmartCarVehicles() {
        const result = await pool.query(`
            SELECT sv.id as smartcar_id, sv.vehicle_id
            FROM smartcar_vehicles sv
            WHERE sv.connection_status = 'connected'
        `);

        result.rows.forEach(row => {
            this.smartcarVehicles.set(row.vehicle_id, row.smartcar_id);
        });

        console.log(`🔗 SmartCar: ${this.smartcarVehicles.size} vehicles connected`);
    }

    // FUEL TRACKING EMULATION
    private startFuelTrackingEmulation() {
        setInterval(async () => {
            try {
                for (const [vehicleId, vehicle] of this.vehicles) {
                    // Consume fuel based on speed and vehicle type
                    let consumption = 0;
                    if (vehicle.speed > 0) {
                        // Moving vehicles consume more fuel
                        consumption = vehicle.fuel_type === 'Electric' ? 0.3 : 0.5;
                    } else {
                        // Idling consumption
                        consumption = vehicle.fuel_type === 'Electric' ? 0.02 : 0.05;
                    }

                    vehicle.fuel_level = Math.max(0, vehicle.fuel_level - consumption);

                    // Update database
                    await pool.query(`
                        UPDATE vehicles SET fuel_level = $1 WHERE id = $2
                    `, [vehicle.fuel_level, vehicleId]);

                    // Auto-refuel if below 20%
                    if (vehicle.fuel_level < 20) {
                        const fuelAdded = 100 - vehicle.fuel_level;
                        vehicle.fuel_level = 100;

                        // Log fuel transaction
                        await pool.query(`
                            INSERT INTO fuel_transactions
                            (vehicle_id, fuel_type, quantity, unit_price, total_cost,
                             odometer_reading, location, latitude, longitude, vendor)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        `, [
                            vehicleId,
                            vehicle.fuel_type,
                            vehicle.fuel_type === 'Electric' ? fuelAdded : fuelAdded / 4, // kWh or gallons
                            vehicle.fuel_type === 'Electric' ? 0.12 : 3.45, // price per unit
                            vehicle.fuel_type === 'Electric' ? fuelAdded * 0.12 : (fuelAdded / 4) * 3.45,
                            vehicle.odometer,
                            'Tallahassee Fuel Station',
                            vehicle.latitude,
                            vehicle.longitude,
                            vehicle.fuel_type === 'Electric' ? 'ChargePoint' : 'Shell'
                        ]);

                        await pool.query(`UPDATE vehicles SET fuel_level = 100 WHERE id = $1`, [vehicleId]);

                        console.log(`⛽ ${vehicle.make} ${vehicle.model} refueled at ${vehicle.fuel_level.toFixed(1)}%`);
                    }
                }
            } catch (error) {
                console.error('❌ Fuel tracking error:', error);
            }
        }, 10000); // Every 10 seconds
    }

    // TRIP EMULATION
    private startTripEmulation() {
        setInterval(async () => {
            try {
                for (const [vehicleId, vehicle] of this.vehicles) {
                    // 30% chance to start a trip if not already on one
                    if (!this.runningTrips.has(vehicleId) && Math.random() < 0.3) {
                        await this.startTrip(vehicleId, vehicle);
                    }

                    // Record GPS breadcrumbs for active trips
                    if (this.runningTrips.has(vehicleId)) {
                        await this.recordBreadcrumb(vehicleId, vehicle);

                        // 10% chance to end trip
                        if (Math.random() < 0.1) {
                            await this.endTrip(vehicleId, vehicle);
                        }
                    }
                }
            } catch (error) {
                console.error('❌ Trip tracking error:', error);
            }
        }, 15000); // Every 15 seconds
    }

    private async startTrip(vehicleId: string, vehicle: Vehicle) {
        try {
            const purposes = ['Patrol', 'Response', 'Maintenance', 'Administrative', 'Training'];
            const purpose = purposes[Math.floor(Math.random() * purposes.length)];

            const result = await pool.query(`
                INSERT INTO trip_history
                (vehicle_id, trip_start, start_latitude, start_longitude,
                 start_odometer, purpose)
                VALUES ($1, NOW(), $2, $3, $4, $5)
                RETURNING id
            `, [vehicleId, vehicle.latitude, vehicle.longitude, vehicle.odometer, purpose]);

            const tripId = result.rows[0].id;
            this.runningTrips.set(vehicleId, tripId);

            // Set vehicle speed
            vehicle.speed = 25 + Math.random() * 20; // 25-45 mph
            await pool.query(`UPDATE vehicles SET speed = $1 WHERE id = $2`, [vehicle.speed, vehicleId]);

            console.log(`🚦 Trip started: ${vehicle.make} ${vehicle.model} - ${purpose}`);
        } catch (error) {
            console.error('❌ Error starting trip:', error);
        }
    }

    private async recordBreadcrumb(vehicleId: string, vehicle: Vehicle) {
        const tripId = this.runningTrips.get(vehicleId);
        if (!tripId) return;

        try {
            // Simulate movement (small random changes)
            vehicle.latitude += (Math.random() - 0.5) * 0.001;
            vehicle.longitude += (Math.random() - 0.5) * 0.001;
            vehicle.odometer += vehicle.speed * 0.004; // Rough miles calculation

            await pool.query(`
                INSERT INTO gps_breadcrumbs
                (trip_id, vehicle_id, timestamp, latitude, longitude, speed, heading)
                VALUES ($1, $2, NOW(), $3, $4, $5, $6)
            `, [tripId, vehicleId, vehicle.latitude, vehicle.longitude, vehicle.speed, Math.random() * 360]);

            // Update vehicle location
            await pool.query(`
                UPDATE vehicles
                SET latitude = $1, longitude = $2, odometer = $3
                WHERE id = $4
            `, [vehicle.latitude, vehicle.longitude, vehicle.odometer, vehicleId]);

        } catch (error) {
            console.error('❌ Error recording breadcrumb:', error);
        }
    }

    private async endTrip(vehicleId: string, vehicle: Vehicle) {
        const tripId = this.runningTrips.get(vehicleId);
        if (!tripId) return;

        try {
            // Calculate trip stats
            const result = await pool.query(`
                SELECT
                    start_latitude, start_longitude, start_odometer,
                    EXTRACT(EPOCH FROM (NOW() - trip_start)) / 60 as duration_minutes
                FROM trip_history
                WHERE id = $1
            `, [tripId]);

            if (result.rows.length === 0) return;

            const trip = result.rows[0];
            const distanceMiles = vehicle.odometer - trip.start_odometer;
            const avgSpeed = distanceMiles / (trip.duration_minutes / 60);
            const fuelConsumed = distanceMiles * (vehicle.fuel_type === 'Electric' ? 0.3 : 0.05);

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
                    fuel_consumed = $8
                WHERE id = $9
            `, [
                vehicle.latitude,
                vehicle.longitude,
                vehicle.odometer,
                distanceMiles,
                trip.duration_minutes,
                avgSpeed,
                vehicle.speed + 5,
                fuelConsumed,
                tripId
            ]);

            this.runningTrips.delete(vehicleId);
            vehicle.speed = 0;
            await pool.query(`UPDATE vehicles SET speed = 0 WHERE id = $1`, [vehicleId]);

            console.log(`🏁 Trip ended: ${vehicle.make} ${vehicle.model} - ${distanceMiles.toFixed(1)} miles`);
        } catch (error) {
            console.error('❌ Error ending trip:', error);
        }
    }

    // SMARTCAR API EMULATION
    private startSmartCarEmulation() {
        setInterval(async () => {
            try {
                for (const [vehicleId, smartcarVehicleId] of this.smartcarVehicles) {
                    const vehicle = this.vehicles.get(vehicleId);
                    if (!vehicle) continue;

                    const isEV = vehicle.fuel_type === 'Electric';

                    await pool.query(`
                        INSERT INTO smartcar_telemetry
                        (smartcar_vehicle_id, odometer, fuel_percent, fuel_range_miles,
                         battery_percent, battery_range_miles,
                         tire_pressure_front_left, tire_pressure_front_right,
                         tire_pressure_rear_left, tire_pressure_rear_right,
                         engine_oil_life_percent, latitude, longitude, speed,
                         is_charging, charge_state)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                    `, [
                        smartcarVehicleId,
                        Math.floor(vehicle.odometer),
                        isEV ? null : vehicle.fuel_level,
                        isEV ? null : vehicle.fuel_level * 3.5, // Rough range estimate
                        isEV ? vehicle.fuel_level : null,
                        isEV ? vehicle.fuel_level * 3.0 : null,
                        32 + Math.random() * 4, // PSI
                        32 + Math.random() * 4,
                        32 + Math.random() * 4,
                        32 + Math.random() * 4,
                        isEV ? null : 50 + Math.random() * 40,
                        vehicle.latitude,
                        vehicle.longitude,
                        vehicle.speed,
                        isEV && vehicle.speed === 0 && vehicle.fuel_level < 90,
                        isEV && vehicle.speed === 0 && vehicle.fuel_level < 90 ? 'CHARGING' : 'NOT_CHARGING'
                    ]);

                    // Update last_data_update
                    await pool.query(`
                        UPDATE smartcar_vehicles
                        SET last_data_update = NOW()
                        WHERE id = $1
                    `, [smartcarVehicleId]);
                }
            } catch (error) {
                console.error('❌ SmartCar telemetry error:', error);
            }
        }, 30000); // Every 30 seconds
    }

    // ALERTS EMULATION
    private startAlertsEmulation() {
        setInterval(async () => {
            try {
                // Check for low fuel alerts
                const lowFuelVehicles = await pool.query(`
                    SELECT v.id, v.make, v.model, v.license_plate, v.fuel_level
                    FROM vehicles v
                    WHERE v.fuel_level < 25
                    AND v.status = 'active'
                    AND NOT EXISTS (
                        SELECT 1 FROM fleet_alerts fa
                        WHERE fa.vehicle_id = v.id
                        AND fa.alert_type = 'low_fuel'
                        AND fa.status = 'active'
                    )
                `);

                for (const vehicle of lowFuelVehicles.rows) {
                    const severity = vehicle.fuel_level < 10 ? 'critical' : 'warning';
                    await pool.query(`
                        INSERT INTO fleet_alerts
                        (vehicle_id, alert_type, severity, title, message, metadata)
                        VALUES ($1, 'low_fuel', $2, $3, $4, $5)
                    `, [
                        vehicle.id,
                        severity,
                        'Low Fuel Alert',
                        `${vehicle.make} ${vehicle.model} (${vehicle.license_plate}) fuel level at ${vehicle.fuel_level.toFixed(1)}%`,
                        JSON.stringify({ fuel_level: vehicle.fuel_level })
                    ]);

                    console.log(`⚠️  Alert: ${vehicle.make} ${vehicle.model} - Low fuel (${vehicle.fuel_level.toFixed(1)}%)`);
                }

                // Auto-resolve alerts when fuel is refilled
                await pool.query(`
                    UPDATE fleet_alerts
                    SET status = 'resolved', resolved_at = NOW()
                    WHERE alert_type = 'low_fuel'
                    AND status = 'active'
                    AND vehicle_id IN (
                        SELECT id FROM vehicles WHERE fuel_level >= 80
                    )
                `);

            } catch (error) {
                console.error('❌ Alerts error:', error);
            }
        }, 60000); // Every minute
    }
}

// Start the emulator
const emulator = new EnhancedFleetEmulator();
emulator.initialize().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('📴 Shutting down gracefully...');
    process.exit(0);
});
