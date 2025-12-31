/**
 * Telemetry Database Schema
 * Production-ready schema for real-time fleet telemetry data
 */

import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  boolean,
  decimal,
  text,
  jsonb,
  real,
  uuid,
  index
} from 'drizzle-orm/pg-core'

// ============================================================================
// GPS Telemetry Table - Real-time location tracking
// ============================================================================
export const gpsTelemetry = pgTable('gps_telemetry', {
  id: serial('id').primaryKey(),
  vehicleId: integer('vehicle_id').notNull(),
  vehicleNumber: varchar('vehicle_number', { length: 50 }).notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  latitude: decimal('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),
  altitude: decimal('altitude', { precision: 8, scale: 2 }),
  speed: decimal('speed', { precision: 6, scale: 2 }).notNull(), // mph
  heading: decimal('heading', { precision: 5, scale: 2 }), // degrees 0-360
  odometer: decimal('odometer', { precision: 10, scale: 2 }), // miles
  accuracy: decimal('accuracy', { precision: 6, scale: 2 }), // meters
  satelliteCount: integer('satellite_count'),
  hdop: decimal('hdop', { precision: 4, scale: 2 }), // Horizontal Dilution of Precision
  isMoving: boolean('is_moving').default(false),
  geofenceId: varchar('geofence_id', { length: 50 }),
  geofenceEvent: varchar('geofence_event', { length: 20 }), // 'entry' | 'exit' | null
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  vehicleIdIdx: index('gps_vehicle_id_idx').on(table.vehicleId),
  timestampIdx: index('gps_timestamp_idx').on(table.timestamp),
  vehicleTimestampIdx: index('gps_vehicle_timestamp_idx').on(table.vehicleId, table.timestamp),
}))

// ============================================================================
// OBD2 Telemetry Table - Engine diagnostics and sensor data
// ============================================================================
export const obd2Telemetry = pgTable('obd2_telemetry', {
  id: serial('id').primaryKey(),
  vehicleId: integer('vehicle_id').notNull(),
  vehicleNumber: varchar('vehicle_number', { length: 50 }).notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),

  // Engine Performance
  rpm: integer('rpm'), // 0-10000
  speed: integer('speed'), // mph
  engineLoad: decimal('engine_load', { precision: 5, scale: 2 }), // percentage
  throttlePosition: decimal('throttle_position', { precision: 5, scale: 2 }), // percentage

  // Temperature Sensors
  coolantTemp: decimal('coolant_temp', { precision: 5, scale: 2 }), // Celsius
  intakeAirTemp: decimal('intake_air_temp', { precision: 5, scale: 2 }), // Celsius
  ambientAirTemp: decimal('ambient_air_temp', { precision: 5, scale: 2 }), // Celsius
  oilTemp: decimal('oil_temp', { precision: 5, scale: 2 }), // Celsius
  transmissionTemp: decimal('transmission_temp', { precision: 5, scale: 2 }), // Celsius

  // Fuel System
  fuelLevel: decimal('fuel_level', { precision: 5, scale: 2 }), // percentage
  fuelPressure: decimal('fuel_pressure', { precision: 7, scale: 2 }), // kPa
  fuelRate: decimal('fuel_rate', { precision: 6, scale: 3 }), // L/h
  shortTermFuelTrim: decimal('short_term_fuel_trim', { precision: 6, scale: 2 }), // percentage
  longTermFuelTrim: decimal('long_term_fuel_trim', { precision: 6, scale: 2 }), // percentage

  // Electrical
  batteryVoltage: decimal('battery_voltage', { precision: 4, scale: 2 }), // volts
  alternatorVoltage: decimal('alternator_voltage', { precision: 4, scale: 2 }), // volts

  // Air Flow
  maf: decimal('maf', { precision: 6, scale: 2 }), // g/s Mass Air Flow
  map: decimal('map', { precision: 6, scale: 2 }), // kPa Manifold Absolute Pressure
  barometricPressure: decimal('barometric_pressure', { precision: 6, scale: 2 }), // kPa

  // Oxygen Sensors
  o2SensorBank1: decimal('o2_sensor_bank1', { precision: 5, scale: 3 }), // volts
  o2SensorBank2: decimal('o2_sensor_bank2', { precision: 5, scale: 3 }), // volts

  // Emissions
  catalystTemp: decimal('catalyst_temp', { precision: 6, scale: 2 }), // Celsius
  egrCommanded: decimal('egr_commanded', { precision: 5, scale: 2 }), // percentage

  // Diagnostics
  dtcCodes: jsonb('dtc_codes').$type<string[]>().default([]), // Array of DTC codes
  checkEngineLight: boolean('check_engine_light').default(false),
  mil: boolean('mil').default(false), // Malfunction Indicator Lamp
  pendingDtcCount: integer('pending_dtc_count').default(0),

  // Engine State
  engineRunTime: integer('engine_run_time'), // seconds since start
  distanceSinceDtcClear: decimal('distance_since_dtc_clear', { precision: 8, scale: 2 }), // miles

  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  vehicleIdIdx: index('obd2_vehicle_id_idx').on(table.vehicleId),
  timestampIdx: index('obd2_timestamp_idx').on(table.timestamp),
  vehicleTimestampIdx: index('obd2_vehicle_timestamp_idx').on(table.vehicleId, table.timestamp),
  dtcIdx: index('obd2_dtc_idx').on(table.checkEngineLight),
}))

// ============================================================================
// Radio Transmissions Table - PTT and dispatch communications
// ============================================================================
export const radioTransmissions = pgTable('radio_transmissions', {
  id: serial('id').primaryKey(),
  transmissionId: uuid('transmission_id').notNull().unique(),
  vehicleId: integer('vehicle_id').notNull(),
  vehicleNumber: varchar('vehicle_number', { length: 50 }).notNull(),
  driverId: integer('driver_id'),
  channelId: varchar('channel_id', { length: 50 }).notNull(),
  channelName: varchar('channel_name', { length: 100 }),
  frequency: varchar('frequency', { length: 20 }),

  timestamp: timestamp('timestamp').notNull().defaultNow(),
  duration: integer('duration'), // milliseconds

  // Signal Quality
  signalStrength: decimal('signal_strength', { precision: 5, scale: 2 }), // 0-100
  audioQuality: decimal('audio_quality', { precision: 5, scale: 2 }), // 0-100
  interference: decimal('interference', { precision: 5, scale: 2 }), // 0-100

  // Location
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  distanceFromBase: decimal('distance_from_base', { precision: 10, scale: 2 }), // meters

  // Transmission Details
  priority: varchar('priority', { length: 20 }).default('routine'), // routine, urgent, emergency
  transmissionType: varchar('transmission_type', { length: 20 }).default('voice'), // voice, tone, data
  message: text('message'),
  isEmergency: boolean('is_emergency').default(false),

  // Metadata
  talkGroup: varchar('talk_group', { length: 50 }),
  unitNumber: varchar('unit_number', { length: 50 }),
  incidentNumber: varchar('incident_number', { length: 50 }),

  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  vehicleIdIdx: index('radio_vehicle_id_idx').on(table.vehicleId),
  timestampIdx: index('radio_timestamp_idx').on(table.timestamp),
  channelIdx: index('radio_channel_idx').on(table.channelId),
  emergencyIdx: index('radio_emergency_idx').on(table.isEmergency),
}))

// ============================================================================
// Radio Channels Table - Channel configuration
// ============================================================================
export const radioChannels = pgTable('radio_channels', {
  id: serial('id').primaryKey(),
  channelId: varchar('channel_id', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  frequency: varchar('frequency', { length: 20 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // dispatch, emergency, tactical, maintenance, common
  priority: integer('priority').default(1),
  encryption: boolean('encryption').default(false),
  maxUsers: integer('max_users').default(100),
  talkGroup: varchar('talk_group', { length: 50 }),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ============================================================================
// Driver Behavior Events Table - Safety and driving events
// ============================================================================
export const driverBehaviorEvents = pgTable('driver_behavior_events', {
  id: serial('id').primaryKey(),
  vehicleId: integer('vehicle_id').notNull(),
  vehicleNumber: varchar('vehicle_number', { length: 50 }).notNull(),
  driverId: integer('driver_id'),

  timestamp: timestamp('timestamp').notNull().defaultNow(),

  // Event Details
  eventType: varchar('event_type', { length: 50 }).notNull(), // speeding, hardBraking, hardAcceleration, idling, seatbelt, distraction
  severity: varchar('severity', { length: 20 }).notNull(), // low, medium, high, critical

  // Speed Data
  speed: decimal('speed', { precision: 6, scale: 2 }), // mph
  speedLimit: decimal('speed_limit', { precision: 6, scale: 2 }), // mph
  speedDelta: decimal('speed_delta', { precision: 6, scale: 2 }), // mph over limit

  // Acceleration Data (g-force)
  accelerationX: decimal('acceleration_x', { precision: 5, scale: 3 }),
  accelerationY: decimal('acceleration_y', { precision: 5, scale: 3 }),
  accelerationZ: decimal('acceleration_z', { precision: 5, scale: 3 }),
  maxGForce: decimal('max_g_force', { precision: 5, scale: 3 }),

  // Location
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),

  // Duration (for events like idling)
  duration: integer('duration'), // seconds

  // Scoring
  scoreImpact: decimal('score_impact', { precision: 5, scale: 2 }), // points deducted
  driverScore: decimal('driver_score', { precision: 5, scale: 2 }), // current driver score

  // Video Reference
  videoClipId: varchar('video_clip_id', { length: 100 }),
  hasVideo: boolean('has_video').default(false),

  // Acknowledgment
  acknowledged: boolean('acknowledged').default(false),
  acknowledgedAt: timestamp('acknowledged_at'),
  acknowledgedBy: integer('acknowledged_by'),

  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  vehicleIdIdx: index('driver_vehicle_id_idx').on(table.vehicleId),
  driverIdIdx: index('driver_driver_id_idx').on(table.driverId),
  timestampIdx: index('driver_timestamp_idx').on(table.timestamp),
  eventTypeIdx: index('driver_event_type_idx').on(table.eventType),
  severityIdx: index('driver_severity_idx').on(table.severity),
}))

// ============================================================================
// IoT Sensor Readings Table - Environmental and cargo sensors
// ============================================================================
export const iotSensorReadings = pgTable('iot_sensor_readings', {
  id: serial('id').primaryKey(),
  vehicleId: integer('vehicle_id').notNull(),
  vehicleNumber: varchar('vehicle_number', { length: 50 }).notNull(),

  timestamp: timestamp('timestamp').notNull().defaultNow(),

  // Temperature Sensors
  engineTemp: decimal('engine_temp', { precision: 5, scale: 2 }), // Celsius
  cabinTemp: decimal('cabin_temp', { precision: 5, scale: 2 }), // Celsius
  cargoTemp: decimal('cargo_temp', { precision: 5, scale: 2 }), // Celsius
  outsideTemp: decimal('outside_temp', { precision: 5, scale: 2 }), // Celsius

  // Humidity
  cabinHumidity: decimal('cabin_humidity', { precision: 5, scale: 2 }), // percentage
  cargoHumidity: decimal('cargo_humidity', { precision: 5, scale: 2 }), // percentage

  // Tire Pressure (PSI)
  tirePressureFrontLeft: decimal('tire_pressure_fl', { precision: 5, scale: 2 }),
  tirePressureFrontRight: decimal('tire_pressure_fr', { precision: 5, scale: 2 }),
  tirePressureRearLeft: decimal('tire_pressure_rl', { precision: 5, scale: 2 }),
  tirePressureRearRight: decimal('tire_pressure_rr', { precision: 5, scale: 2 }),

  // Cargo
  cargoWeight: decimal('cargo_weight', { precision: 8, scale: 2 }), // lbs
  cargoVolume: decimal('cargo_volume', { precision: 8, scale: 2 }), // cubic feet

  // Door Status
  driverDoorOpen: boolean('driver_door_open').default(false),
  passengerDoorOpen: boolean('passenger_door_open').default(false),
  rearDoorOpen: boolean('rear_door_open').default(false),
  cargoDoorOpen: boolean('cargo_door_open').default(false),
  hoodOpen: boolean('hood_open').default(false),
  trunkOpen: boolean('trunk_open').default(false),

  // Vehicle State
  ignitionOn: boolean('ignition_on').default(false),
  engineRunning: boolean('engine_running').default(false),
  parkingBrakeEngaged: boolean('parking_brake_engaged').default(false),
  seatbeltFastened: boolean('seatbelt_fastened').default(true),

  // Accelerometer (g-force)
  accelerometerX: decimal('accelerometer_x', { precision: 5, scale: 3 }),
  accelerometerY: decimal('accelerometer_y', { precision: 5, scale: 3 }),
  accelerometerZ: decimal('accelerometer_z', { precision: 5, scale: 3 }),

  // Gyroscope (degrees/second)
  gyroscopeX: decimal('gyroscope_x', { precision: 6, scale: 3 }),
  gyroscopeY: decimal('gyroscope_y', { precision: 6, scale: 3 }),
  gyroscopeZ: decimal('gyroscope_z', { precision: 6, scale: 3 }),

  // Connectivity
  cellularSignalStrength: integer('cellular_signal_strength'), // dBm (-120 to -50)
  cellularNetworkType: varchar('cellular_network_type', { length: 10 }), // 4G, 5G, LTE
  wifiConnected: boolean('wifi_connected').default(false),
  gpsConnected: boolean('gps_connected').default(true),

  // Battery (for IoT device)
  deviceBatteryLevel: decimal('device_battery_level', { precision: 5, scale: 2 }), // percentage

  // Alerts
  hasAlert: boolean('has_alert').default(false),
  alertType: varchar('alert_type', { length: 50 }),
  alertMessage: text('alert_message'),

  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  vehicleIdIdx: index('iot_vehicle_id_idx').on(table.vehicleId),
  timestampIdx: index('iot_timestamp_idx').on(table.timestamp),
  alertIdx: index('iot_alert_idx').on(table.hasAlert),
}))

// ============================================================================
// Routes Table - Predefined vehicle routes
// ============================================================================
export const routes = pgTable('routes', {
  id: serial('id').primaryKey(),
  routeId: varchar('route_id', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // delivery, longhaul, service, shuttle, emergency
  estimatedDuration: integer('estimated_duration'), // minutes
  estimatedDistance: decimal('estimated_distance', { precision: 8, scale: 2 }), // miles
  waypoints: jsonb('waypoints').$type<Array<{
    lat: number
    lng: number
    name: string
    type: string
    stopDuration: number
  }>>(),
  roadTypes: jsonb('road_types').$type<string[]>(),
  trafficPatterns: jsonb('traffic_patterns'),
  priority: varchar('priority', { length: 20 }),
  frequency: varchar('frequency', { length: 50 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ============================================================================
// Geofences Table - Geographic boundaries
// ============================================================================
export const geofences = pgTable('geofences', {
  id: serial('id').primaryKey(),
  geofenceId: varchar('geofence_id', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // operational, restricted, warning
  centerLat: decimal('center_lat', { precision: 10, scale: 7 }).notNull(),
  centerLng: decimal('center_lng', { precision: 10, scale: 7 }).notNull(),
  radius: decimal('radius', { precision: 10, scale: 2 }).notNull(), // meters
  alertOnEntry: boolean('alert_on_entry').default(false),
  alertOnExit: boolean('alert_on_exit').default(false),
  speedLimit: decimal('speed_limit', { precision: 5, scale: 2 }), // mph, for speed zone geofences
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ============================================================================
// Dispatch Templates Table - Pre-defined radio dispatch messages
// ============================================================================
export const dispatchTemplates = pgTable('dispatch_templates', {
  id: serial('id').primaryKey(),
  templateId: varchar('template_id', { length: 50 }).notNull().unique(),
  category: varchar('category', { length: 50 }).notNull(), // emergency, routine, incident, status
  priority: varchar('priority', { length: 20 }).notNull(), // low, medium, high, critical
  messageTemplate: text('message_template').notNull(),
  placeholders: jsonb('placeholders').$type<string[]>(), // ['UNIT_ID', 'LOCATION', 'TIME']
  tenCode: varchar('ten_code', { length: 20 }), // 10-4, 10-33, etc.
  responseRequired: boolean('response_required').default(false),
  estimatedDuration: integer('estimated_duration'), // seconds
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
})

// ============================================================================
// Emulator Vehicle Config Table - Runtime vehicle configuration
// ============================================================================
export const emulatorVehicleConfig = pgTable('emulator_vehicle_config', {
  id: serial('id').primaryKey(),
  vehicleId: integer('vehicle_id').notNull().unique(),
  vehicleNumber: varchar('vehicle_number', { length: 50 }).notNull(),

  // Emulator Settings
  gpsEnabled: boolean('gps_enabled').default(true),
  obd2Enabled: boolean('obd2_enabled').default(true),
  iotEnabled: boolean('iot_enabled').default(true),
  radioEnabled: boolean('radio_enabled').default(false),

  // Starting Position
  startingLat: decimal('starting_lat', { precision: 10, scale: 7 }),
  startingLng: decimal('starting_lng', { precision: 10, scale: 7 }),
  homeBaseLat: decimal('home_base_lat', { precision: 10, scale: 7 }),
  homeBaseLng: decimal('home_base_lng', { precision: 10, scale: 7 }),
  homeBaseName: varchar('home_base_name', { length: 255 }),

  // Driver Behavior
  driverBehavior: varchar('driver_behavior', { length: 20 }).default('normal'), // aggressive, normal, cautious

  // Assigned Route
  assignedRouteId: varchar('assigned_route_id', { length: 50 }),

  // Features
  features: jsonb('features').$type<string[]>().default([]),

  // Runtime State
  isRunning: boolean('is_running').default(false),
  lastUpdateAt: timestamp('last_update_at'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ============================================================================
// Telemetry Aggregates Table - Pre-computed statistics (hourly/daily)
// ============================================================================
export const telemetryAggregates = pgTable('telemetry_aggregates', {
  id: serial('id').primaryKey(),
  vehicleId: integer('vehicle_id').notNull(),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  periodType: varchar('period_type', { length: 20 }).notNull(), // hourly, daily, weekly

  // Distance & Time
  totalDistance: decimal('total_distance', { precision: 10, scale: 2 }), // miles
  totalDrivingTime: integer('total_driving_time'), // seconds
  totalIdleTime: integer('total_idle_time'), // seconds

  // Speed
  avgSpeed: decimal('avg_speed', { precision: 6, scale: 2 }),
  maxSpeed: decimal('max_speed', { precision: 6, scale: 2 }),
  speedingInstances: integer('speeding_instances'),

  // Fuel
  fuelConsumed: decimal('fuel_consumed', { precision: 8, scale: 2 }), // gallons
  avgMpg: decimal('avg_mpg', { precision: 6, scale: 2 }),

  // Driver Score
  avgDriverScore: decimal('avg_driver_score', { precision: 5, scale: 2 }),
  hardBrakingCount: integer('hard_braking_count'),
  hardAccelerationCount: integer('hard_acceleration_count'),

  // Engine
  avgRpm: integer('avg_rpm'),
  avgCoolantTemp: decimal('avg_coolant_temp', { precision: 5, scale: 2 }),
  dtcCount: integer('dtc_count'),

  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  vehiclePeriodIdx: index('agg_vehicle_period_idx').on(table.vehicleId, table.periodStart),
  periodTypeIdx: index('agg_period_type_idx').on(table.periodType),
}))

console.log('Telemetry database schema created with 12 tables')
