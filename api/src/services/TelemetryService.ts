/**
 * TelemetryService - Production-ready telemetry data service
 * Handles all database operations for GPS, OBD2, radio, driver behavior, and IoT data
 * Eliminates hardcoded data by reading from database
 */

import { EventEmitter } from 'events'

import logger from '../config/logger'

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

import { pool } from '../db'

// Database connection interface (works with actual DB or mock)
interface DatabaseConnection {
  query: (sql: string, params?: any[]) => Promise<any[]>
  execute: (sql: string, params?: any[]) => Promise<{ rowCount: number }>
}

export interface TelemetryVehicle {
  id: string
  // Canonical DB identifiers
  dbId: string
  tenantId: string
  // Human / UI identifiers
  vehicleNumber: string
  name: string
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
  private canPersistGps: boolean = false
  private canPersistObd2: boolean = false
  private hasRoutes: boolean = false
  private hasGeofences: boolean = false
  private hasRadioChannels: boolean = false

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

    const conn: DatabaseConnection =
      dbConnection ??
      ({
        query: async (sql: string, params?: any[]) => (await pool.query(sql, params)).rows,
        execute: async (sql: string, params?: any[]) => {
          const res = await pool.query(sql, params)
          return { rowCount: res.rowCount ?? 0 }
        },
      } as DatabaseConnection)

    this.db = conn

    // Test the connection
    try {
      await this.db.query('SELECT 1')
      logger.info('TelemetryService: Database connection established')
    } catch (error) {
      throw new Error(`TelemetryService: Database connection failed - ${error}`)
    }

    // Detect which persistence tables are available (avoid hammering missing tables).
    try {
      const [gpsTable] = await this.db.query(`SELECT to_regclass('public.gps_tracks') AS name`)
      const [telemetryTable] = await this.db.query(`SELECT to_regclass('public.telemetry_data') AS name`)
      this.canPersistGps = Boolean(gpsTable?.name)
      this.canPersistObd2 = Boolean(telemetryTable?.name)
    } catch (error) {
      // If introspection fails, default to safe mode (no persistence).
      this.canPersistGps = false
      this.canPersistObd2 = false
      logger.warn('TelemetryService: table detection failed; telemetry persistence disabled', { error })
    }

    // Detect optional configuration tables (routes/geofences/radio channels). Keep service resilient
    // when demo DBs are missing some tables.
    try {
      const [routesTable] = await this.db.query(`SELECT to_regclass('public.routes') AS name`)
      const [geofencesTable] = await this.db.query(`SELECT to_regclass('public.geofences') AS name`)
      const [radioChannelsTable] = await this.db.query(`SELECT to_regclass('public.radio_channels') AS name`)
      this.hasRoutes = Boolean(routesTable?.name)
      this.hasGeofences = Boolean(geofencesTable?.name)
      this.hasRadioChannels = Boolean(radioChannelsTable?.name)
    } catch (error) {
      this.hasRoutes = false
      this.hasGeofences = false
      this.hasRadioChannels = false
      logger.warn('TelemetryService: optional table detection failed; continuing with minimal telemetry', { error })
    }

    // Load initial data
    await this.loadVehicles()
    await this.loadRoutes()
    await this.loadRadioChannels()
    await this.loadGeofences()

    // Start batch flush interval
    this.flushInterval = setInterval(() => {
      this.flushBuffers().catch((error) => logger.error('Error flushing telemetry buffers', { error }))
    }, 5000) // Flush every 5 seconds

    this.isInitialized = true
    logger.info(`TelemetryService initialized with ${this.vehicleCache.size} vehicles, ${this.routeCache.size} routes`)
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
          v.tenant_id,
          v.number as vehicle_number,
          v.name,
          v.make,
          v.model,
          v.year,
          v.vin,
          v.license_plate,
          v.status,
          v.odometer as mileage,
          v.fuel_type,
          v.latitude,
          v.longitude,
          v.metadata
        FROM vehicles v
        WHERE v.is_active = true AND v.status = 'active'
        ORDER BY v.created_at, v.id
      `)

      let idx = 0
      for (const row of results) {
        idx += 1
        const vehicle = this.mapDatabaseVehicle(row, idx)
        this.vehicleCache.set(vehicle.id, vehicle)
      }

      logger.info(`Loaded ${this.vehicleCache.size} vehicles from database`)
    } catch (error) {
      logger.error('Failed to load vehicles from database', { error })
      throw error
    }
  }

  /**
   * Map database row to TelemetryVehicle
   */
  private mapDatabaseVehicle(row: any, sequence: number): TelemetryVehicle {
    const specs = row.metadata?.specifications || row.specifications || {}
    const fallbackCoords = { lat: 30.4383, lng: -84.2807 }
    const coords =
      row.latitude != null && row.longitude != null
        ? { lat: Number(row.latitude), lng: Number(row.longitude) }
        : fallbackCoords
    const driverBehavior =
      row.metadata?.driverBehavior === 'aggressive' ||
      row.metadata?.driverBehavior === 'cautious' ||
      row.metadata?.driverBehavior === 'normal'
        ? row.metadata.driverBehavior
        : 'normal'

    return {
      id: `VEH-${String(sequence).padStart(3, '0')}`,
      dbId: String(row.id),
      tenantId: String(row.tenant_id),
      vehicleNumber: row.vehicle_number,
      name: row.name,
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
        lat: coords.lat,
        lng: coords.lng
      },
      homeBase: {
        lat: coords.lat,
        lng: coords.lng,
        name: row.metadata?.homeBaseName || 'Fleet Center'
      },
      driverBehavior,
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
    if (!this.hasRoutes) return

    try {
      // Support multiple schemas (the project contains both `route_name/total_distance` and `name/estimated_distance` styles).
      // Prefer the "current" schema used by seeded demo DBs (name, description, type, estimated_distance).
      let results: any[] = []
      try {
        results = await this.db.query(`
          SELECT
            id,
            name,
            description,
            type,
            status,
            estimated_duration,
            estimated_distance,
            actual_distance,
            waypoints
          FROM routes
          WHERE status::text NOT IN ('cancelled')
          ORDER BY scheduled_start_time NULLS LAST, created_at DESC, id
          LIMIT 250
        `)
      } catch (err: unknown) {
        // Fall back to older schema (route_name/total_distance, start/end_location, notes).
        results = await this.db.query(`
          SELECT
            id,
            route_name,
            status,
            start_location,
            end_location,
            estimated_duration,
            total_distance,
            waypoints,
            notes
          FROM routes
          WHERE status::text NOT IN ('cancelled')
          ORDER BY planned_start_time NULLS LAST, created_at DESC, id
          LIMIT 250
        `)
      }

      for (const row of results) {
        const id = String(row.id)
        const name = String(row.name || row.route_name || `Route ${id.slice(0, 8)}`)
        const estimatedDuration = Number(row.estimated_duration ?? row.actual_duration ?? 0) || 0
        const estimatedDistance =
          Number(row.estimated_distance ?? row.total_distance ?? row.actual_distance ?? 0) || 0

        const descriptionParts = [
          row.description ? String(row.description) : null,
          row.start_location ? `From ${row.start_location}` : null,
          row.end_location ? `to ${row.end_location}` : null,
          row.notes ? String(row.notes) : null,
        ].filter(Boolean) as string[]

        const waypointsRaw = Array.isArray(row.waypoints) ? row.waypoints : []
        const waypoints = waypointsRaw
          .map((w: any, idx: number) => {
            const lat = Number(w.lat ?? w.latitude ?? w.center_lat ?? w.center_latitude)
            const lng = Number(w.lng ?? w.lon ?? w.longitude ?? w.center_lng ?? w.center_longitude)
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

            const typeRaw = String(w.type || 'waypoint').toLowerCase()
            const type =
              typeRaw === 'depot' ||
              typeRaw === 'delivery' ||
              typeRaw === 'service' ||
              typeRaw === 'break' ||
              typeRaw === 'pickup' ||
              typeRaw === 'emergency' ||
              typeRaw === 'waypoint'
                ? typeRaw
                : 'waypoint'

            return {
              lat,
              lng,
              name: String(w.name ?? w.address ?? w.location ?? `Stop ${idx + 1}`),
              type,
              stopDuration: Number(w.stopDuration ?? w.stop_duration ?? 0) || 0,
            }
          })
          .filter(Boolean) as TelemetryRoute['waypoints']

        const route: TelemetryRoute = {
          id,
          routeId: id,
          name,
          description: descriptionParts.join(' ') || name,
          type: this.normalizeRouteType(String(row.type || ''), name, estimatedDistance),
          estimatedDuration,
          estimatedDistance,
          waypoints,
          roadTypes: [],
          trafficPatterns: {},
        }
        this.routeCache.set(route.id, route)
      }

      logger.info(`Loaded ${this.routeCache.size} routes from database`)
    } catch (error) {
      logger.error('Failed to load routes from database', { error })
      // Routes are optional - continue without them
      logger.info('Continuing without routes')
    }
  }

  private normalizeRouteType(raw: string, name: string, estimatedDistanceMiles: number): TelemetryRoute['type'] {
    const normalized = raw.toLowerCase()
    if (normalized === 'delivery' || normalized === 'longhaul' || normalized === 'service' || normalized === 'shuttle' || normalized === 'emergency') {
      return normalized
    }
    return this.inferRouteType(name, estimatedDistanceMiles)
  }

  private inferRouteType(name: string, estimatedDistanceMiles: number): TelemetryRoute['type'] {
    const n = name.toLowerCase()
    if (n.includes('emerg')) return 'emergency'
    if (n.includes('shuttle')) return 'shuttle'
    if (n.includes('service') || n.includes('maintenance') || n.includes('repair')) return 'service'
    if (n.includes('delivery') || n.includes('drop') || n.includes('pickup')) return 'delivery'
    if (estimatedDistanceMiles >= 80) return 'longhaul'
    return 'delivery'
  }


  /**
   * Load radio channels
   */
  private async loadRadioChannels(): Promise<void> {
    if (!this.db) {
      throw new Error('Database connection not available')
    }
    if (!this.hasRadioChannels) return

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

      logger.info(`Loaded ${this.channelCache.size} radio channels from database`)
    } catch (error) {
      logger.error('Failed to load radio channels from database', { error })
      // Radio channels are optional - continue without them
      logger.info('Continuing without radio channels')
    }
  }

  /**
   * Load geofences
   */
  private async loadGeofences(): Promise<void> {
    if (!this.db) {
      throw new Error('Database connection not available')
    }
    if (!this.hasGeofences) return

    try {
      const results = await this.db.query(`
        SELECT
          id,
          name,
          type,
          center_lat,
          center_lng,
          center_latitude,
          center_longitude,
          radius,
          radius_meters,
          notify_on_entry,
          notify_on_exit,
          alert_on_entry,
          alert_on_exit
        FROM geofences
        WHERE is_active = true
        ORDER BY created_at, id
      `)

      for (const row of results) {
        const lat = Number(row.center_lat ?? row.center_latitude)
        const lng = Number(row.center_lng ?? row.center_longitude)
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue

        const geofence: Geofence = {
          id: String(row.id),
          name: String(row.name),
          type: this.inferGeofenceType(`${row.type ?? ''} ${row.name ?? ''}`),
          center: {
            lat,
            lng,
          },
          radius: Number(row.radius_meters ?? row.radius) || 0,
          alertOnEntry: Boolean(row.alert_on_entry ?? row.notify_on_entry),
          alertOnExit: Boolean(row.alert_on_exit ?? row.notify_on_exit),
        }
        this.geofenceCache.set(geofence.id, geofence)
      }

      logger.info(`Loaded ${this.geofenceCache.size} geofences from database`)
    } catch (error) {
      logger.error('Failed to load geofences from database', { error })
      // Geofences are optional - continue without them
      logger.info('Continuing without geofences')
    }
  }

  private inferGeofenceType(name: string): Geofence['type'] {
    const n = name.toLowerCase()
    if (n.includes('restrict') || n.includes('no-go') || n.includes('nog o') || n.includes('secure')) return 'restricted'
    return 'operational'
  }

  // ============================================================================
  // TELEMETRY PERSISTENCE METHODS
  // ============================================================================

  /**
   * Save GPS telemetry data
   */
  public async saveGPSTelemetry(data: GPSTelemetry): Promise<void> {
    const v = this.resolveVehicle(data.vehicleId)
    if (!v) return
    this.gpsBuffer.push({
      tenantId: v.tenantId,
      vehicleDbId: v.dbId,
      vehicleNumber: data.vehicleId,
      timestamp: data.timestamp,
      latitude: data.location.lat,
      longitude: data.location.lng,
      altitude: data.location.altitude,
      speed: data.speed,
      heading: data.heading,
      // gps_tracks.odometer is an integer; emulator odometer is fractional miles.
      odometer: Number.isFinite(data.odometer) ? Math.round(data.odometer) : null,
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
    const v = this.resolveVehicle(data.vehicleId)
    if (!v) return
    this.obd2Buffer.push({
      tenantId: v.tenantId,
      vehicleDbId: v.dbId,
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
    // Current production schema does not include radio transmission tables.
    // Keep the event stream for in-memory consumers but don't buffer/persist.
    this.emit('radio-saved', data)
  }

  /**
   * Save driver behavior event
   */
  public async saveDriverBehaviorEvent(data: DriverBehaviorEvent): Promise<void> {
    // Current production schema does not include driver behavior tables.
    // Keep the event stream for in-memory consumers but don't buffer/persist.
    this.emit('driver-behavior-saved', data)
  }

  /**
   * Save IoT sensor data
   */
  public async saveIoTSensorData(data: IoTSensorData): Promise<void> {
    // Current production schema does not include IoT sensor tables.
    // Keep the event stream for in-memory consumers but don't buffer/persist.
    this.emit('iot-saved', data)
  }

  /**
   * Flush all buffers to database
   */
  private async flushBuffers(): Promise<void> {
    if (!this.db) return

    const promises: Promise<void>[] = []

    if (this.canPersistGps && this.gpsBuffer.length > 0) {
      promises.push(this.flushGPSBuffer())
    }
    if (this.canPersistObd2 && this.obd2Buffer.length > 0) {
      promises.push(this.flushOBD2Buffer())
    }
    // Radio/driver/IoT tables are not present in the current schema; do not attempt persistence.

    await Promise.all(promises)
  }

  private async flushGPSBuffer(): Promise<void> {
    const items = this.gpsBuffer.splice(0, this.gpsBuffer.length)
    if (items.length === 0 || !this.db) return

    try {
      const cols = [
        'tenant_id',
        'vehicle_id',
        'timestamp',
        'latitude',
        'longitude',
        'altitude',
        'speed',
        'heading',
        'accuracy',
        'odometer',
        'metadata',
      ]
      const params: any[] = []
      const valuesSql = items
        .map((item, i) => {
          const base = i * cols.length
          params.push(
            item.tenantId,
            item.vehicleDbId,
            item.timestamp,
            item.latitude,
            item.longitude,
            item.altitude ?? null,
            item.speed ?? null,
            item.heading ?? null,
            item.accuracy ?? null,
            item.odometer ?? null,
            {
              vehicleNumber: item.vehicleNumber,
              satelliteCount: item.satelliteCount ?? null,
              isMoving: Boolean(item.isMoving),
            }
          )
          const placeholders = cols.map((_, c) => `$${base + c + 1}`).join(',')
          return `(${placeholders})`
        })
        .join(',')

      await this.db.query(
        `INSERT INTO gps_tracks (${cols.join(',')}) VALUES ${valuesSql}`,
        params
      )
    } catch (error) {
      logger.error('Failed to flush GPS buffer', { error })
      // Re-add items to buffer for retry
      this.gpsBuffer.unshift(...items)
    }
  }

  private async flushOBD2Buffer(): Promise<void> {
    const items = this.obd2Buffer.splice(0, this.obd2Buffer.length)
    if (items.length === 0 || !this.db) return

    try {
      const cols = [
        'tenant_id',
        'vehicle_id',
        'timestamp',
        'engine_rpm',
        'engine_temperature',
        'battery_voltage',
        'diagnostic_codes',
        'raw_data',
      ]
      const params: any[] = []
      const valuesSql = items
        .map((item, i) => {
          const diagnosticCodes = Array.isArray(item.dtcCodes)
            ? item.dtcCodes
            : item.dtcCodes instanceof Set
              ? Array.from(item.dtcCodes)
              : item.dtcCodes
                ? [String(item.dtcCodes)]
                : []
          const base = i * cols.length
          params.push(
            item.tenantId,
            item.vehicleDbId,
            item.timestamp,
            item.rpm ?? null,
            item.coolantTemp ?? null,
            item.batteryVoltage ?? null,
            diagnosticCodes.length > 0 ? diagnosticCodes : null,
            {
              vehicleNumber: item.vehicleNumber,
              speed: item.speed ?? null,
              engineLoad: item.engineLoad ?? null,
              throttlePosition: item.throttlePosition ?? null,
              fuelLevel: item.fuelLevel ?? null,
              maf: item.maf ?? null,
              o2Sensor: item.o2SensorBank1 ?? null,
              checkEngineLight: Boolean(item.checkEngineLight),
              mil: Boolean(item.mil),
            }
          )
          const placeholders = cols.map((_, c) => `$${base + c + 1}`).join(',')
          return `(${placeholders})`
        })
        .join(',')

      await this.db.query(
        `INSERT INTO telemetry_data (${cols.join(',')}) VALUES ${valuesSql}`,
        params
      )
    } catch (error) {
      logger.error('Failed to flush OBD2 buffer', { error })
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
        type: route.type,
        estimatedDuration: route.estimatedDuration,
        estimatedDistance: route.estimatedDistance,
        waypoints: route.waypoints.map(wp => ({
          ...wp,
          type: wp.type
        })),
        roadTypes: route.roadTypes,
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
      const v = this.resolveVehicle(vehicleId)
      if (!v) return null

      const [gpsResult, obd2Result] = await Promise.all([
        this.canPersistGps
          ? this.db.query(
              `SELECT * FROM gps_tracks WHERE tenant_id = $1 AND vehicle_id = $2 ORDER BY timestamp DESC LIMIT 1`,
              [v.tenantId, v.dbId]
            )
          : Promise.resolve([]),
        this.canPersistObd2
          ? this.db.query(
              `SELECT * FROM telemetry_data WHERE tenant_id = $1 AND vehicle_id = $2 ORDER BY timestamp DESC LIMIT 1`,
              [v.tenantId, v.dbId]
            )
          : Promise.resolve([]),
      ])

      return {
        gps: gpsResult[0] ? this.mapGPSRow(gpsResult[0], v.id) : undefined,
        obd2: obd2Result[0] ? this.mapOBD2Row(obd2Result[0], v.id) : undefined,
        iot: undefined,
      }
    } catch (error) {
      logger.error('Failed to get latest telemetry', { error })
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

    const v = this.resolveVehicle(vehicleId)
    if (!v) return []

    try {
      if (type === 'gps' && this.canPersistGps) {
        return await this.db.query(
          `SELECT * FROM gps_tracks
           WHERE tenant_id = $1 AND vehicle_id = $2
             AND timestamp >= $3 AND timestamp <= $4
           ORDER BY timestamp DESC
           LIMIT $5`,
          [v.tenantId, v.dbId, startTime, endTime, limit]
        )
      }

      if (type === 'obd2' && this.canPersistObd2) {
        return await this.db.query(
          `SELECT * FROM telemetry_data
           WHERE tenant_id = $1 AND vehicle_id = $2
             AND timestamp >= $3 AND timestamp <= $4
           ORDER BY timestamp DESC
           LIMIT $5`,
          [v.tenantId, v.dbId, startTime, endTime, limit]
        )
      }

      return []
    } catch (error) {
      logger.error(`Failed to get ${type} telemetry history`, { error })
      return []
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private resolveVehicle(vehicleId: string): TelemetryVehicle | null {
    const direct = this.vehicleCache.get(vehicleId)
    if (direct) return direct
    for (const v of this.vehicleCache.values()) {
      if (v.dbId === vehicleId) return v
      if (v.vehicleNumber === vehicleId) return v
    }
    return null
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

  private mapGPSRow(row: any, vehicleId: string): GPSTelemetry {
    return {
      vehicleId,
      timestamp: new Date(row.timestamp),
      location: {
        lat: parseFloat(row.latitude),
        lng: parseFloat(row.longitude),
        altitude: row.altitude ? parseFloat(row.altitude) : undefined,
        accuracy: row.accuracy ? parseFloat(row.accuracy) : undefined
      },
      speed: row.speed != null ? parseFloat(row.speed) : 0,
      heading: row.heading ? parseFloat(row.heading) : 0,
      odometer: row.odometer ? parseFloat(row.odometer) : 0,
      accuracy: row.accuracy ? parseFloat(row.accuracy) : 0,
      satelliteCount: typeof row.metadata?.satelliteCount === 'number' ? row.metadata.satelliteCount : undefined
    }
  }

  private mapOBD2Row(row: any, vehicleId: string): OBD2Data {
    const raw = row.raw_data || {}
    return {
      vehicleId,
      timestamp: new Date(row.timestamp),
      rpm: row.engine_rpm != null ? Number(row.engine_rpm) : 0,
      speed: raw.speed != null ? Number(raw.speed) : 0,
      coolantTemp: row.engine_temperature != null ? Number(row.engine_temperature) : 0,
      fuelLevel: raw.fuelLevel != null ? Number(raw.fuelLevel) : 0,
      batteryVoltage: row.battery_voltage != null ? Number(row.battery_voltage) : 0,
      engineLoad: raw.engineLoad != null ? Number(raw.engineLoad) : 0,
      throttlePosition: raw.throttlePosition != null ? Number(raw.throttlePosition) : 0,
      maf: raw.maf != null ? Number(raw.maf) : 0,
      o2Sensor: raw.o2Sensor != null ? Number(raw.o2Sensor) : 0,
      dtcCodes: Array.isArray(row.diagnostic_codes) ? row.diagnostic_codes : [],
      checkEngineLight: Boolean(raw.checkEngineLight),
      mil: Boolean(raw.mil)
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
    logger.info('TelemetryService shutdown complete')
  }
}

// Export singleton instance
export const telemetryService = new TelemetryService()
