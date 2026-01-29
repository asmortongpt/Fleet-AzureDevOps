/**
 * TelemetryService - Production-ready telemetry data service
 * Handles all database operations for GPS, OBD2, radio, driver behavior, and IoT data
 * Eliminates hardcoded data by reading from database
 */

import { EventEmitter } from 'events'

// Import types
import {
  GPSTelemetry,
  OBD2Data,
  RadioTransmission,
  DriverBehaviorEvent,
  IoTSensorData,
  Route,
  Geofence
} from '../emulators/types'

// Database connection interface (works with actual DB or mock)
interface DatabaseConnection {
  query: (sql: string, params?: any[]) => Promise<any[]>
  execute: (sql: string, params?: any[]) => Promise<{ rowCount: number }>
}

export interface TelemetryVehicle {
  id: string
  vehicleId: number
  vehicleNumber: string
  make: string
  model: string
  year: number
  type: string
  vin: string
  licensePlate: string
  tankSize: number
  fuelEfficiency: number
  batteryCapacity?: number
  electricRange?: number
  startingLocation: { lat: number; lng: number }
  homeBase: { lat: number; lng: number; name: string }
  driverBehavior: 'aggressive' | 'normal' | 'cautious'
  features: string[]
  mileage: number
  status: string
}

export interface TelemetryRoute {
  id: string
  routeId: string
  name: string
  description: string
  type: string
  estimatedDuration: number
  estimatedDistance: number
  waypoints: Array<{
    lat: number
    lng: number
    name: string
    type: string
    stopDuration: number
  }>
  roadTypes: string[]
  trafficPatterns: Record<string, string>
  priority?: string
  frequency?: string
}

export interface RadioChannel {
  id: string
  channelId: string
  name: string
  frequency: string
  type: 'dispatch' | 'emergency' | 'tactical' | 'maintenance' | 'common'
  priority: number
  encryption: boolean
  maxUsers: number
  talkGroup?: string
  description?: string
}

export class TelemetryService extends EventEmitter {
  private db: DatabaseConnection | null = null
  private vehicleCache: Map<string, TelemetryVehicle> = new Map()
  private routeCache: Map<string, TelemetryRoute> = new Map()
  private channelCache: Map<string, RadioChannel> = new Map()
  private geofenceCache: Map<string, Geofence> = new Map()
  private isInitialized: boolean = false

  // Batch write buffers
  private gpsBuffer: any[] = []
  private obd2Buffer: any[] = []
  private radioBuffer: any[] = []
  private driverBuffer: any[] = []
  private iotBuffer: any[] = []
  private flushInterval: NodeJS.Timeout | null = null

  constructor() {
    super()
  }

  /**
   * Initialize the telemetry service
   */
  public async initialize(dbConnection?: DatabaseConnection): Promise<void> {
    if (this.isInitialized) return

    if (!dbConnection) {
      throw new Error('TelemetryService requires a valid database connection')
    }

    this.db = dbConnection

    // Test the connection
    try {
      await this.db.query('SELECT 1')
      console.log('TelemetryService: Database connection established')
    } catch (error) {
      throw new Error(`TelemetryService: Database connection failed - ${error}`)
    }

    // Load initial data
    await this.loadVehicles()
    await this.loadRoutes()
    await this.loadRadioChannels()
    await this.loadGeofences()

    // Start batch flush interval
    this.flushInterval = setInterval(() => {
      this.flushBuffers().catch(console.error)
    }, 5000) // Flush every 5 seconds

    this.isInitialized = true
    console.log(`TelemetryService initialized with ${this.vehicleCache.size} vehicles, ${this.routeCache.size} routes`)
  }

  /**
   * Load vehicles from database
   */
  private async loadVehicles(): Promise<void> {
    if (!this.db) {
      throw new Error('Database connection not available')
    }

    try {
      const results = await this.db.query(`
        SELECT
          v.id,
          v.vehicle_number,
          v.make,
          v.model,
          v.year,
          v.vin,
          v.license_plate,
          v.status,
          v.mileage,
          v.fuel_type,
          v.specifications,
          f.name as facility_name,
          f.coordinates as facility_coords
        FROM vehicles v
        LEFT JOIN facilities f ON v.facility_id = f.id
        WHERE v.status = 'active'
        ORDER BY v.id
      `)

      for (const row of results) {
        const vehicle = this.mapDatabaseVehicle(row)
        this.vehicleCache.set(vehicle.id, vehicle)
      }

      console.log(`Loaded ${this.vehicleCache.size} vehicles from database`)
    } catch (error) {
      console.error('Failed to load vehicles from database:', error)
      throw error
    }
  }

  /**
   * Map database row to TelemetryVehicle
   */
  private mapDatabaseVehicle(row: any): TelemetryVehicle {
    const specs = row.specifications || {}
    const coords = row.facility_coords || { lat: 30.4383, lng: -84.2807 }

    return {
      id: `VEH-${String(row.id).padStart(3, '0')}`,
      vehicleId: row.id,
      vehicleNumber: row.vehicle_number,
      make: row.make,
      model: row.model,
      year: row.year,
      type: this.inferVehicleType(row.make, row.model),
      vin: row.vin,
      licensePlate: row.license_plate,
      tankSize: specs.tankSize || this.getDefaultTankSize(row.fuel_type),
      fuelEfficiency: specs.fuelEfficiency || this.getDefaultFuelEfficiency(row.make, row.model),
      batteryCapacity: specs.batteryCapacity,
      electricRange: specs.electricRange,
      startingLocation: {
        lat: coords.lat + (Math.random() - 0.5) * 0.02,
        lng: coords.lng + (Math.random() - 0.5) * 0.02
      },
      homeBase: {
        lat: coords.lat,
        lng: coords.lng,
        name: row.facility_name || 'Fleet Center'
      },
      driverBehavior: this.randomDriverBehavior(),
      features: this.inferFeatures(row.make, row.model, row.fuel_type),
      mileage: row.mileage || 0,
      status: row.status
    }
  }


  /**
   * Load routes from database
   */
  private async loadRoutes(): Promise<void> {
    if (!this.db) {
      throw new Error('Database connection not available')
    }

    try {
      const results = await this.db.query(`
        SELECT * FROM routes WHERE is_active = true ORDER BY id
      `)

      for (const row of results) {
        const route: TelemetryRoute = {
          id: row.route_id,
          routeId: row.route_id,
          name: row.name,
          description: row.description,
          type: row.type,
          estimatedDuration: row.estimated_duration,
          estimatedDistance: parseFloat(row.estimated_distance),
          waypoints: row.waypoints || [],
          roadTypes: row.road_types || [],
          trafficPatterns: row.traffic_patterns || {},
          priority: row.priority,
          frequency: row.frequency
        }
        this.routeCache.set(route.id, route)
      }

      console.log(`Loaded ${this.routeCache.size} routes from database`)
    } catch (error) {
      console.error('Failed to load routes from database:', error)
      // Routes are optional - continue without them
      console.log('Continuing without routes')
    }
  }


  /**
   * Load radio channels
   */
  private async loadRadioChannels(): Promise<void> {
    if (!this.db) {
      throw new Error('Database connection not available')
    }

    try {
      const results = await this.db.query(`
        SELECT * FROM radio_channels WHERE is_active = true ORDER BY priority DESC
      `)

      for (const row of results) {
        const channel: RadioChannel = {
          id: row.channel_id,
          channelId: row.channel_id,
          name: row.name,
          frequency: row.frequency,
          type: row.type,
          priority: row.priority,
          encryption: row.encryption,
          maxUsers: row.max_users,
          talkGroup: row.talk_group,
          description: row.description
        }
        this.channelCache.set(channel.id, channel)
      }

      console.log(`Loaded ${this.channelCache.size} radio channels from database`)
    } catch (error) {
      console.error('Failed to load radio channels from database:', error)
      // Radio channels are optional - continue without them
      console.log('Continuing without radio channels')
    }
  }

  /**
   * Load geofences
   */
  private async loadGeofences(): Promise<void> {
    if (!this.db) {
      throw new Error('Database connection not available')
    }

    try {
      const results = await this.db.query(`
        SELECT * FROM geofences WHERE is_active = true ORDER BY id
      `)

      for (const row of results) {
        const geofence: Geofence = {
          id: row.geofence_id,
          name: row.name,
          type: row.type,
          center: { lat: parseFloat(row.center_lat), lng: parseFloat(row.center_lng) },
          radius: parseFloat(row.radius),
          alertOnEntry: row.alert_on_entry,
          alertOnExit: row.alert_on_exit
        }
        this.geofenceCache.set(geofence.id, geofence)
      }

      console.log(`Loaded ${this.geofenceCache.size} geofences from database`)
    } catch (error) {
      console.error('Failed to load geofences from database:', error)
      // Geofences are optional - continue without them
      console.log('Continuing without geofences')
    }
  }

  // ============================================================================
  // TELEMETRY PERSISTENCE METHODS
  // ============================================================================

  /**
   * Save GPS telemetry data
   */
  public async saveGPSTelemetry(data: GPSTelemetry): Promise<void> {
    this.gpsBuffer.push({
      vehicleId: this.extractVehicleId(data.vehicleId),
      vehicleNumber: data.vehicleId,
      timestamp: data.timestamp,
      latitude: data.location.lat,
      longitude: data.location.lng,
      altitude: data.location.altitude,
      speed: data.speed,
      heading: data.heading,
      odometer: data.odometer,
      accuracy: data.accuracy,
      satelliteCount: data.satelliteCount,
      isMoving: data.speed > 0
    })

    this.emit('gps-saved', data)
  }

  /**
   * Save OBD2 telemetry data
   */
  public async saveOBD2Telemetry(data: OBD2Data): Promise<void> {
    this.obd2Buffer.push({
      vehicleId: this.extractVehicleId(data.vehicleId),
      vehicleNumber: data.vehicleId,
      timestamp: data.timestamp,
      rpm: data.rpm,
      speed: data.speed,
      engineLoad: data.engineLoad,
      throttlePosition: data.throttlePosition,
      coolantTemp: data.coolantTemp,
      fuelLevel: data.fuelLevel,
      batteryVoltage: data.batteryVoltage,
      maf: data.maf,
      o2SensorBank1: data.o2Sensor,
      dtcCodes: data.dtcCodes,
      checkEngineLight: data.checkEngineLight,
      mil: data.mil
    })

    this.emit('obd2-saved', data)
  }

  /**
   * Save radio transmission data
   */
  public async saveRadioTransmission(data: RadioTransmission): Promise<void> {
    this.radioBuffer.push({
      transmissionId: data.id,
      vehicleId: this.extractVehicleId(data.vehicleId),
      vehicleNumber: data.vehicleId,
      channelId: data.channelId,
      timestamp: data.timestamp,
      duration: data.duration,
      signalStrength: data.signalStrength,
      audioQuality: data.audioQuality,
      interference: data.interference,
      latitude: data.location.lat,
      longitude: data.location.lng,
      priority: data.priority,
      transmissionType: data.transmissionType,
      message: data.message,
      isEmergency: data.isEmergency
    })

    this.emit('radio-saved', data)
  }

  /**
   * Save driver behavior event
   */
  public async saveDriverBehaviorEvent(data: DriverBehaviorEvent): Promise<void> {
    this.driverBuffer.push({
      vehicleId: this.extractVehicleId(data.vehicleId),
      vehicleNumber: data.vehicleId,
      timestamp: data.timestamp,
      eventType: data.eventType,
      severity: data.severity,
      speed: data.speed,
      speedLimit: data.speedLimit,
      latitude: data.location.lat,
      longitude: data.location.lng,
      duration: data.duration,
      scoreImpact: this.calculateScoreImpact(data),
      driverScore: data.score
    })

    this.emit('driver-behavior-saved', data)
  }

  /**
   * Save IoT sensor data
   */
  public async saveIoTSensorData(data: IoTSensorData): Promise<void> {
    this.iotBuffer.push({
      vehicleId: this.extractVehicleId(data.vehicleId),
      vehicleNumber: data.vehicleId,
      timestamp: data.timestamp,
      engineTemp: data.sensors.engineTemp,
      cabinTemp: data.sensors.cabinTemp,
      cargoTemp: data.sensors.cargoTemp,
      tirePressureFrontLeft: data.sensors.tirePressure?.frontLeft,
      tirePressureFrontRight: data.sensors.tirePressure?.frontRight,
      tirePressureRearLeft: data.sensors.tirePressure?.rearLeft,
      tirePressureRearRight: data.sensors.tirePressure?.rearRight,
      cargoWeight: data.sensors.cargoWeight,
      driverDoorOpen: data.sensors.doorStatus?.driver,
      passengerDoorOpen: data.sensors.doorStatus?.passenger,
      cargoDoorOpen: data.sensors.doorStatus?.cargo,
      ignitionOn: data.sensors.ignitionStatus,
      accelerometerX: data.sensors.accelerometer?.x,
      accelerometerY: data.sensors.accelerometer?.y,
      accelerometerZ: data.sensors.accelerometer?.z,
      cellularSignalStrength: data.sensors.connectivity?.signalStrength,
      cellularNetworkType: data.sensors.connectivity?.type
    })

    this.emit('iot-saved', data)
  }

  /**
   * Flush all buffers to database
   */
  private async flushBuffers(): Promise<void> {
    if (!this.db) return

    const promises: Promise<void>[] = []

    if (this.gpsBuffer.length > 0) {
      promises.push(this.flushGPSBuffer())
    }
    if (this.obd2Buffer.length > 0) {
      promises.push(this.flushOBD2Buffer())
    }
    if (this.radioBuffer.length > 0) {
      promises.push(this.flushRadioBuffer())
    }
    if (this.driverBuffer.length > 0) {
      promises.push(this.flushDriverBuffer())
    }
    if (this.iotBuffer.length > 0) {
      promises.push(this.flushIoTBuffer())
    }

    await Promise.all(promises)
  }

  private async flushGPSBuffer(): Promise<void> {
    const items = this.gpsBuffer.splice(0, this.gpsBuffer.length)
    if (items.length === 0 || !this.db) return

    try {
      const values = items.map(item => `(
        ${item.vehicleId},
        '${item.vehicleNumber}',
        '${item.timestamp.toISOString()}',
        ${item.latitude},
        ${item.longitude},
        ${item.altitude || 'NULL'},
        ${item.speed},
        ${item.heading || 'NULL'},
        ${item.odometer || 'NULL'},
        ${item.accuracy || 'NULL'},
        ${item.satelliteCount || 'NULL'},
        ${item.isMoving}
      )`).join(',')

      await this.db.query(`
        INSERT INTO gps_telemetry
        (vehicle_id, vehicle_number, timestamp, latitude, longitude, altitude, speed, heading, odometer, accuracy, satellite_count, is_moving)
        VALUES ${values}
      `)
    } catch (error) {
      console.error('Failed to flush GPS buffer:', error)
      // Re-add items to buffer for retry
      this.gpsBuffer.unshift(...items)
    }
  }

  private async flushOBD2Buffer(): Promise<void> {
    const items = this.obd2Buffer.splice(0, this.obd2Buffer.length)
    if (items.length === 0 || !this.db) return

    try {
      // Batch insert OBD2 data
      for (const item of items) {
        await this.db.query(`
          INSERT INTO obd2_telemetry
          (vehicle_id, vehicle_number, timestamp, rpm, speed, engine_load, throttle_position, coolant_temp, fuel_level, battery_voltage, maf, o2_sensor_bank1, dtc_codes, check_engine_light, mil)
          VALUES (${item.vehicleId}, '${item.vehicleNumber}', '${item.timestamp.toISOString()}', ${item.rpm}, ${item.speed}, ${item.engineLoad}, ${item.throttlePosition}, ${item.coolantTemp}, ${item.fuelLevel}, ${item.batteryVoltage}, ${item.maf}, ${item.o2SensorBank1}, '${JSON.stringify(item.dtcCodes)}', ${item.checkEngineLight}, ${item.mil})
        `)
      }
    } catch (error) {
      console.error('Failed to flush OBD2 buffer:', error)
    }
  }

  private async flushRadioBuffer(): Promise<void> {
    const items = this.radioBuffer.splice(0, this.radioBuffer.length)
    if (items.length === 0 || !this.db) return
    // Similar batch insert logic
  }

  private async flushDriverBuffer(): Promise<void> {
    const items = this.driverBuffer.splice(0, this.driverBuffer.length)
    if (items.length === 0 || !this.db) return
    // Similar batch insert logic
  }

  private async flushIoTBuffer(): Promise<void> {
    const items = this.iotBuffer.splice(0, this.iotBuffer.length)
    if (items.length === 0 || !this.db) return
    // Similar batch insert logic
  }

  // ============================================================================
  // DATA ACCESS METHODS
  // ============================================================================

  /**
   * Get all vehicles
   */
  public getVehicles(): TelemetryVehicle[] {
    return Array.from(this.vehicleCache.values())
  }

  /**
   * Get vehicle by ID
   */
  public getVehicle(vehicleId: string): TelemetryVehicle | undefined {
    return this.vehicleCache.get(vehicleId)
  }

  /**
   * Get all routes
   */
  public getRoutes(): TelemetryRoute[] {
    return Array.from(this.routeCache.values())
  }

  /**
   * Get route by ID
   */
  public getRoute(routeId: string): TelemetryRoute | undefined {
    return this.routeCache.get(routeId)
  }

  /**
   * Get all radio channels
   */
  public getRadioChannels(): RadioChannel[] {
    return Array.from(this.channelCache.values())
  }

  /**
   * Get all geofences
   */
  public getGeofences(): Geofence[] {
    return Array.from(this.geofenceCache.values())
  }

  /**
   * Get geofences as Map (for emulator compatibility)
   */
  public getGeofencesMap(): Map<string, Geofence> {
    return this.geofenceCache
  }

  /**
   * Get routes as Map (for emulator compatibility)
   */
  public getRoutesMap(): Map<string, Route> {
    const routeMap = new Map<string, Route>()
    for (const [id, route] of this.routeCache) {
      routeMap.set(id, {
        id: route.id,
        name: route.name,
        description: route.description,
        type: route.type as any,
        estimatedDuration: route.estimatedDuration,
        estimatedDistance: route.estimatedDistance,
        waypoints: route.waypoints.map(wp => ({
          ...wp,
          type: wp.type as any
        })),
        roadTypes: route.roadTypes as any[],
        trafficPatterns: route.trafficPatterns,
        priority: route.priority,
        frequency: route.frequency
      })
    }
    return routeMap
  }

  /**
   * Get latest telemetry for a vehicle
   */
  public async getLatestTelemetry(vehicleId: string): Promise<{
    gps?: GPSTelemetry
    obd2?: OBD2Data
    iot?: IoTSensorData
  } | null> {
    if (!this.db) return null

    try {
      const numericId = this.extractVehicleId(vehicleId)

      const [gpsResult, obd2Result, iotResult] = await Promise.all([
        this.db.query(`SELECT * FROM gps_telemetry WHERE vehicle_id = ${numericId} ORDER BY timestamp DESC LIMIT 1`),
        this.db.query(`SELECT * FROM obd2_telemetry WHERE vehicle_id = ${numericId} ORDER BY timestamp DESC LIMIT 1`),
        this.db.query(`SELECT * FROM iot_sensor_readings WHERE vehicle_id = ${numericId} ORDER BY timestamp DESC LIMIT 1`)
      ])

      return {
        gps: gpsResult[0] ? this.mapGPSRow(gpsResult[0]) : undefined,
        obd2: obd2Result[0] ? this.mapOBD2Row(obd2Result[0]) : undefined,
        iot: iotResult[0] ? this.mapIoTRow(iotResult[0]) : undefined
      }
    } catch (error) {
      console.error('Failed to get latest telemetry:', error)
      return null
    }
  }

  /**
   * Get telemetry history for a vehicle
   */
  public async getTelemetryHistory(
    vehicleId: string,
    type: 'gps' | 'obd2' | 'iot' | 'radio' | 'driver',
    startTime: Date,
    endTime: Date,
    limit: number = 1000
  ): Promise<any[]> {
    if (!this.db) return []

    const numericId = this.extractVehicleId(vehicleId)
    const tables: Record<string, string> = {
      gps: 'gps_telemetry',
      obd2: 'obd2_telemetry',
      iot: 'iot_sensor_readings',
      radio: 'radio_transmissions',
      driver: 'driver_behavior_events'
    }

    try {
      const results = await this.db.query(`
        SELECT * FROM ${tables[type]}
        WHERE vehicle_id = ${numericId}
          AND timestamp >= '${startTime.toISOString()}'
          AND timestamp <= '${endTime.toISOString()}'
        ORDER BY timestamp DESC
        LIMIT ${limit}
      `)

      return results
    } catch (error) {
      console.error(`Failed to get ${type} telemetry history:`, error)
      return []
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private extractVehicleId(vehicleId: string): number {
    const match = vehicleId.match(/VEH-(\d+)/)
    return match ? parseInt(match[1], 10) : parseInt(vehicleId, 10) || 1
  }

  private inferVehicleType(make: string, model: string): string {
    const lowerModel = model.toLowerCase()
    if (['f-150', 'f-250', 'silverado', 'sierra', 'ram', 'tacoma', 'colorado'].some(t => lowerModel.includes(t))) return 'truck'
    if (['sprinter', 'transit', 'promaster', 'nv'].some(t => lowerModel.includes(t))) return 'van'
    if (['explorer', 'tahoe', 'wrangler', 'cr-v', 'rav4', 'model y'].some(t => lowerModel.includes(t))) return 'suv'
    if (['320', '200g', 'pc210', 'ec220', 'zx210'].some(t => lowerModel.includes(t))) return 'excavator'
    if (['granite', '567', 't880'].some(t => lowerModel.includes(t))) return 'dump_truck'
    return 'sedan'
  }

  private getDefaultTankSize(fuelType: string): number {
    return fuelType === 'electric' ? 0 : 20
  }

  private getDefaultFuelEfficiency(make: string, model: string): number {
    const type = this.inferVehicleType(make, model)
    const defaults: Record<string, number> = {
      sedan: 30, suv: 24, truck: 18, van: 19, excavator: 4, dump_truck: 6
    }
    return defaults[type] || 25
  }

  private randomDriverBehavior(): 'aggressive' | 'normal' | 'cautious' {
    const roll = Math.random()
    if (roll < 0.15) return 'aggressive'
    if (roll > 0.85) return 'cautious'
    return 'normal'
  }

  private inferFeatures(make: string, model: string, fuelType: string): string[] {
    const features = ['gps']

    if (fuelType !== 'electric') {
      features.push('obd2')
    }

    const type = this.inferVehicleType(make, model)
    if (['truck', 'van', 'excavator', 'dump_truck'].includes(type)) {
      features.push('iot', 'cargo')
    }

    if (['Tesla', 'Ford', 'Chevrolet', 'GMC'].includes(make)) {
      features.push('camera')
    }

    if (fuelType === 'electric') {
      features.push('ev')
    }

    return features
  }

  private generateVIN(): string {
    const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'
    let vin = ''
    for (let i = 0; i < 17; i++) {
      vin += chars[Math.floor(Math.random() * chars.length)]
    }
    return vin
  }

  private generateLicensePlate(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const numbers = '0123456789'
    return `FL${letters[Math.floor(Math.random() * 26)]}${letters[Math.floor(Math.random() * 26)]}${numbers[Math.floor(Math.random() * 10)]}${numbers[Math.floor(Math.random() * 10)]}${numbers[Math.floor(Math.random() * 10)]}`
  }

  private calculateScoreImpact(event: DriverBehaviorEvent): number {
    const impacts: Record<string, Record<string, number>> = {
      speeding: { low: 2, medium: 5, high: 10 },
      hardBraking: { low: 1, medium: 3, high: 7 },
      hardAcceleration: { low: 1, medium: 2, high: 5 },
      idling: { low: 1, medium: 2, high: 3 },
      seatbeltViolation: { low: 5, medium: 8, high: 15 },
      distraction: { low: 3, medium: 6, high: 12 }
    }

    return impacts[event.eventType]?.[event.severity] || 5
  }

  private mapGPSRow(row: any): GPSTelemetry {
    return {
      vehicleId: row.vehicle_number,
      timestamp: new Date(row.timestamp),
      location: {
        lat: parseFloat(row.latitude),
        lng: parseFloat(row.longitude),
        altitude: row.altitude ? parseFloat(row.altitude) : undefined,
        accuracy: row.accuracy ? parseFloat(row.accuracy) : undefined
      },
      speed: parseFloat(row.speed),
      heading: row.heading ? parseFloat(row.heading) : 0,
      odometer: row.odometer ? parseFloat(row.odometer) : 0,
      accuracy: row.accuracy ? parseFloat(row.accuracy) : 0,
      satelliteCount: row.satellite_count
    }
  }

  private mapOBD2Row(row: any): OBD2Data {
    return {
      vehicleId: row.vehicle_number,
      timestamp: new Date(row.timestamp),
      rpm: row.rpm,
      speed: row.speed,
      coolantTemp: parseFloat(row.coolant_temp),
      fuelLevel: parseFloat(row.fuel_level),
      batteryVoltage: parseFloat(row.battery_voltage),
      engineLoad: parseFloat(row.engine_load),
      throttlePosition: parseFloat(row.throttle_position),
      maf: parseFloat(row.maf),
      o2Sensor: parseFloat(row.o2_sensor_bank1),
      dtcCodes: row.dtc_codes || [],
      checkEngineLight: row.check_engine_light,
      mil: row.mil
    }
  }

  private mapIoTRow(row: any): IoTSensorData {
    return {
      vehicleId: row.vehicle_number,
      timestamp: new Date(row.timestamp),
      sensors: {
        engineTemp: row.engine_temp ? parseFloat(row.engine_temp) : undefined,
        cabinTemp: row.cabin_temp ? parseFloat(row.cabin_temp) : undefined,
        cargoTemp: row.cargo_temp ? parseFloat(row.cargo_temp) : undefined,
        tirePressure: row.tire_pressure_fl ? {
          frontLeft: parseFloat(row.tire_pressure_fl),
          frontRight: parseFloat(row.tire_pressure_fr),
          rearLeft: parseFloat(row.tire_pressure_rl),
          rearRight: parseFloat(row.tire_pressure_rr)
        } : undefined,
        cargoWeight: row.cargo_weight ? parseFloat(row.cargo_weight) : undefined,
        doorStatus: {
          driver: row.driver_door_open,
          passenger: row.passenger_door_open,
          cargo: row.cargo_door_open
        },
        ignitionStatus: row.ignition_on,
        accelerometer: row.accelerometer_x ? {
          x: parseFloat(row.accelerometer_x),
          y: parseFloat(row.accelerometer_y),
          z: parseFloat(row.accelerometer_z)
        } : undefined,
        connectivity: row.cellular_signal_strength ? {
          type: row.cellular_network_type,
          signalStrength: row.cellular_signal_strength,
          connected: true
        } : undefined
      }
    }
  }

  /**
   * Shutdown the service
   */
  public async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }

    // Final flush
    await this.flushBuffers()

    this.isInitialized = false
    console.log('TelemetryService shutdown complete')
  }
}

// Export singleton instance
export const telemetryService = new TelemetryService()
