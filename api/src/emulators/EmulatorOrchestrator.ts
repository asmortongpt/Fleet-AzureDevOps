/**
 * EmulatorOrchestrator - Central control system for all fleet emulators
 * Coordinates GPS, OBD-II, Fuel, Maintenance, Driver, Route, Cost, and IoT emulators
 * Now integrated with TelemetryService for database persistence
 */

import { EventEmitter } from 'events'
import * as fs from 'fs'
import * as path from 'path'

import { WebSocketServer, WebSocket } from 'ws'

// Dynamic config generator for realistic data
import { telemetryService, TelemetryVehicle } from '../services/TelemetryService'

import { DispatchEmulator } from './DispatchEmulator'
import { InventoryEmulator } from './InventoryEmulator'
import { generateVehiclesConfig, generateRoutesConfig, EmulatorVehicle, EmulatorRoute, EmulatorGeofence } from './config/generateDynamicConfig'
import type { CostEmulator } from './cost/CostEmulator'
import { DriverBehaviorEmulator } from './driver/DriverBehaviorEmulator'
import { EVChargingEmulator } from './evcharging/EVChargingEmulator'
import { FuelEmulator } from './fuel/FuelEmulator'
import { GPSEmulator } from './gps/GPSEmulator'
import { RealisticGPSEmulator } from './gps/RealisticGPSEmulator'
import { VehicleInventoryEmulator } from './inventory/VehicleInventoryEmulator'
import { IoTEmulator } from './iot/IoTEmulator'
import { MaintenanceEmulator } from './maintenance/MaintenanceEmulator'
import { OBD2Emulator } from './obd2/OBD2Emulator'
import { RealisticOBD2Emulator } from './obd2/RealisticOBD2Emulator'
import { RadioEmulator } from './radio/RadioEmulator'
import { RouteEmulator } from './route/RouteEmulator'
import {
  EmulatorConfig,
  EmulatorState,
  EmulatorEvent,
  EmulatorStats,
  Vehicle,
  Route,
  Scenario,
  Geofence,
  GPSTelemetry,
  OBD2Data,
  RadioTransmission,
  DriverBehaviorEvent,
  IoTSensorData
} from './types'
import { VideoTelematicsEmulator } from './video/VideoTelematicsEmulator'


export class EmulatorOrchestrator extends EventEmitter {
  private config: EmulatorConfig
  private vehicles: Map<string, Vehicle> = new Map()
  private routes: Map<string, Route> = new Map()
  private scenarios: Map<string, Scenario> = new Map()
  private geofences: Map<string, Geofence> = new Map()

  // Emulator instances
  private gpsEmulators: Map<string, GPSEmulator> = new Map()
  private obd2Emulators: Map<string, OBD2Emulator> = new Map()
  private fuelEmulators: Map<string, FuelEmulator> = new Map()
  private maintenanceEmulators: Map<string, MaintenanceEmulator> = new Map()
  private driverEmulators: Map<string, DriverBehaviorEmulator> = new Map()
  private routeEmulators: Map<string, RouteEmulator> = new Map()
  private costEmulators: Map<string, CostEmulator> = new Map()
  private iotEmulators: Map<string, IoTEmulator> = new Map()
  private evChargingEmulators: Map<string, EVChargingEmulator> = new Map()
  private vehicleInventoryEmulator: VehicleInventoryEmulator | null = null
  private videoTelematicsEmulators: Map<string, VideoTelematicsEmulator> = new Map()
  private radioEmulators: Map<string, RadioEmulator> = new Map()
  private dispatchEmulator: DispatchEmulator | null = null
  private inventoryEmulator: InventoryEmulator | null = null

  // State management
  private states: Map<string, EmulatorState> = new Map()
  private currentScenario: string | null = null
  private isRunning: boolean = false
  private isPaused: boolean = false
  private startTime: Date | null = null
  private pauseTime: Date | null = null

  // WebSocket
  private wss: WebSocketServer | null = null
  private wsClients: Set<WebSocket> = new Set()

  // Stats
  private stats: EmulatorStats = {
    totalVehicles: 0,
    activeVehicles: 0,
    totalEvents: 0,
    eventsPerSecond: 0,
    uptime: 0,
    memoryUsage: 0
  }

  private eventQueue: EmulatorEvent[] = []
  private statsInterval: NodeJS.Timeout | null = null
  private telemetryServiceInitialized: boolean = false

  constructor(configPath?: string) {
    super()

    // Load configuration
    const defaultConfigPath = path.join(__dirname, 'config', 'default.json')
    const configFile = configPath || defaultConfigPath
    this.config = JSON.parse(fs.readFileSync(configFile, `utf-8`))

    // Initialize TelemetryService first, then load data
    this.initializeTelemetryService().then(() => {
      // Load vehicles, routes, scenarios from database via TelemetryService
      this.loadVehiclesFromService()
      this.loadRoutesFromService()
      this.loadScenarios() // Scenarios can stay as config for now

      console.log(`EmulatorOrchestrator initialized with ${this.vehicles.size} vehicles from database`)
    }).catch((err) => {
      console.warn('TelemetryService initialization failed, falling back to JSON files:', err)
      // Fallback to JSON files
      this.loadVehicles()
      this.loadRoutes()
      this.loadScenarios()
    })

    // Initialize WebSocket if enabled
    if (this.config.realtime?.websocket?.enabled) {
      this.initializeWebSocket()
    }

    // Setup event listeners
    this.setupEventListeners()

    // Initialize Dispatch Emulator (system-wide, not per-vehicle)
    this.initializeDispatchEmulator()

    // Initialize Inventory Emulator (system-wide, not per-vehicle)
    this.initializeInventoryEmulator()

    console.log(`EmulatorOrchestrator initialized with ${this.vehicles.size} vehicles`)
  }

  /**
   * Initialize the TelemetryService for database integration
   */
  private async initializeTelemetryService(): Promise<void> {
    if (this.telemetryServiceInitialized) return

    await telemetryService.initialize()
    this.telemetryServiceInitialized = true
    console.log('TelemetryService initialized for EmulatorOrchestrator')
  }

  /**
   * Load vehicles from TelemetryService (database-backed)
   */
  private loadVehiclesFromService(): void {
    const dbVehicles = telemetryService.getVehicles()

    for (const dbVehicle of dbVehicles) {
      const vehicle = this.mapTelemetryVehicle(dbVehicle)
      this.vehicles.set(vehicle.id, vehicle)
    }

    this.stats.totalVehicles = this.vehicles.size
    console.log(`Loaded ${this.vehicles.size} vehicles from TelemetryService`)
  }

  /**
   * Map TelemetryVehicle to internal Vehicle type
   */
  private mapTelemetryVehicle(tv: TelemetryVehicle): Vehicle {
    return {
      id: tv.id,
      make: tv.make,
      model: tv.model,
      year: tv.year,
      type: tv.type as any,
      vin: tv.vin,
      licensePlate: tv.licensePlate,
      tankSize: tv.tankSize,
      fuelEfficiency: tv.fuelEfficiency,
      batteryCapacity: tv.batteryCapacity,
      electricRange: tv.electricRange,
      startingLocation: tv.startingLocation,
      homeBase: tv.homeBase,
      driverBehavior: tv.driverBehavior,
      features: tv.features
    }
  }

  /**
   * Load routes from TelemetryService (database-backed)
   */
  private loadRoutesFromService(): void {
    const routeMap = telemetryService.getRoutesMap()

    for (const [id, route] of routeMap) {
      this.routes.set(id, route)
    }

    // Load geofences from TelemetryService
    const geofenceMap = telemetryService.getGeofencesMap()
    for (const [id, geofence] of geofenceMap) {
      this.geofences.set(id, geofence)
    }

    console.log(`Loaded ${this.routes.size} routes and ${this.geofences.size} geofences from TelemetryService`)
  }

  /**
   * Initialize the Dispatch Radio Emulator
   */
  private initializeDispatchEmulator(): void {
    this.dispatchEmulator = new DispatchEmulator({
      updateIntervalMs: this.config.emulators?.dispatch?.updateIntervalMs || 15000,
      transmissionProbability: 0.3,
      emergencyProbability: 0.05
    })

    // Listen for dispatch transmissions
    this.dispatchEmulator.on('transmission', (transmission) => {
      this.emit('dispatch', {
        type: 'dispatch',
        vehicleId: transmission.vehicleId,
        timestamp: new Date(),
        data: transmission
      })
    })

    // Listen for emergency transmissions
    this.dispatchEmulator.on('emergency-transmission', (transmission) => {
      this.emit('dispatch-emergency', {
        type: 'dispatch-emergency',
        vehicleId: transmission.vehicleId,
        timestamp: new Date(),
        data: transmission,
        priority: 'critical'
      })
    })

    console.log('Dispatch Radio Emulator initialized')
  }

  /**
   * Initialize the Inventory Management Emulator
   */
  private initializeInventoryEmulator(): void {
    this.inventoryEmulator = new InventoryEmulator(this.config)

    // Listen for inventory events
    this.inventoryEmulator.on('data', (event) => {
      this.emit('inventory', event)
    })

    this.inventoryEmulator.on('low-stock-alert', (alert) => {
      this.emit('inventory-low-stock-alert', {
        type: 'inventory-low-stock-alert',
        vehicleId: '',
        timestamp: new Date(),
        data: alert,
        priority: alert.severity === 'critical' || alert.severity === 'out-of-stock' ? 'high' : 'normal'
      })
    })

    console.log('Inventory Management Emulator initialized')
  }

  /**
   * Load vehicles from configuration
   * Uses dynamic generation for realistic, non-hardcoded data
   * Falls back to static JSON if dynamic generation fails
   */
  private loadVehicles(): void {
    try {
      // Use dynamic config generator for realistic data
      const dynamicConfig = generateVehiclesConfig(15);

      dynamicConfig.vehicles.forEach((vehicle: EmulatorVehicle) => {
        // Convert to Vehicle type expected by emulators
        this.vehicles.set(vehicle.id, vehicle as unknown as Vehicle);
      });

      console.log(`[EmulatorOrchestrator] Dynamically generated ${dynamicConfig.vehicles.length} vehicles`);
    } catch (error) {
      // Fallback to static JSON file if dynamic generation fails
      console.warn('[EmulatorOrchestrator] Dynamic vehicle generation failed, falling back to static config');
      const vehiclesPath = path.join(__dirname, `config`, 'vehicles.json');
      const data = JSON.parse(fs.readFileSync(vehiclesPath, 'utf-8'));

      data.vehicles.forEach((vehicle: Vehicle) => {
        this.vehicles.set(vehicle.id, vehicle);
      });
    }

    this.stats.totalVehicles = this.vehicles.size;
  }

  /**
   * Load routes from configuration
   * Uses dynamic generation for realistic, non-hardcoded data
   * Falls back to static JSON if dynamic generation fails
   */
  private loadRoutes(): void {
    try {
      // Use dynamic config generator for realistic data
      const dynamicConfig = generateRoutesConfig(10, 8);

      dynamicConfig.routes.forEach((route: EmulatorRoute) => {
        // Convert to Route type expected by emulators
        this.routes.set(route.id, route as unknown as Route);
      });

      dynamicConfig.geofences.forEach((geofence: EmulatorGeofence) => {
        // Convert to Geofence type expected by emulators
        this.geofences.set(geofence.id, geofence as unknown as Geofence);
      });

      console.log(`[EmulatorOrchestrator] Dynamically generated ${dynamicConfig.routes.length} routes and ${dynamicConfig.geofences.length} geofences`);
    } catch (error) {
      // Fallback to static JSON file if dynamic generation fails
      console.warn('[EmulatorOrchestrator] Dynamic route generation failed, falling back to static config');
      const routesPath = path.join(__dirname, 'config', 'routes.json');
      const data = JSON.parse(fs.readFileSync(routesPath, 'utf-8'));

      data.routes.forEach((route: Route) => {
        this.routes.set(route.id, route);
      });

      if (data.geofences) {
        data.geofences.forEach((geofence: Geofence) => {
          this.geofences.set(geofence.id, geofence);
        });
      }
    }
  }

  /**
   * Load scenarios from configuration
   */
  private loadScenarios(): void {
    const scenariosPath = path.join(__dirname, 'config', 'scenarios.json')
    if (!fs.existsSync(scenariosPath)) {
      console.warn(`[EmulatorOrchestrator] scenarios.json not found at ${scenariosPath} - skipping scenario load`)
      return
    }

    try {
      const data = JSON.parse(fs.readFileSync(scenariosPath, 'utf-8'))
      Object.entries(data.scenarios || {}).forEach(([key, scenario]) => {
        this.scenarios.set(key, scenario as Scenario)
      })
    } catch (error) {
      console.warn(`[EmulatorOrchestrator] Failed to load scenarios:`, error)
    }
  }

  /**
   * Initialize WebSocket server for real-time streaming
   */
  private initializeWebSocket(): void {
    const port = this.config.realtime.websocket.port
    this.wss = new WebSocketServer({ port })

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('WebSocket client connected')
      this.wsClients.add(ws)

      // Send initial state
      ws.send(JSON.stringify({
        type: 'connection',
        data: {
          vehicles: Array.from(this.vehicles.values()),
          routes: Array.from(this.routes.values()),
          scenarios: Array.from(this.scenarios.keys()),
          status: this.getStatus()
        }
      }))

      ws.on('close', () => {
        console.log('WebSocket client disconnected')
        this.wsClients.delete(ws)
      })

      ws.on('error', (error) => {
        console.error(`WebSocket error:`, error)
        this.wsClients.delete(ws)
      })
    })

    console.log(`WebSocket server started on port ${port}`)
  }

  /**
   * Setup event listeners for all emulators
   */
  private setupEventListeners(): void {
    const eventTypes = [
      `gps`, 'obd2', 'fuel', 'maintenance',
      'driver', 'route', 'cost', 'iot', 'radio', 'dispatch', 'dispatch-emergency',
      'inventory', 'inventory-low-stock-alert'
    ]

    eventTypes.forEach(type => {
      this.on(type, (event: EmulatorEvent) => {
        this.handleEmulatorEvent(event)
      })
    })
  }

  /**
   * Handle emulator events
   */
  private handleEmulatorEvent(event: EmulatorEvent): void {
    this.eventQueue.push(event)
    this.stats.totalEvents++

    // Broadcast to WebSocket clients
    this.broadcast({
      type: 'event',
      data: event
    })

    // Persist to database if enabled
    if (this.config.persistence?.enabled) {
      this.persistEvent(event).catch(console.error)
    }
  }

  /**
   * Broadcast message to all WebSocket clients
   */
  private broadcast(message: any): void {
    const payload = JSON.stringify(message)

    this.wsClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload)
      }
    })
  }

  /**
   * Persist event to database via TelemetryService
   */
  private async persistEvent(event: EmulatorEvent): Promise<void> {
    if (!this.telemetryServiceInitialized) {
      return // Skip if TelemetryService not ready
    }

    try {
      switch (event.type) {
        case 'gps':
          await telemetryService.saveGPSTelemetry(event.data as GPSTelemetry)
          break

        case 'obd2':
          await telemetryService.saveOBD2Telemetry(event.data as OBD2Data)
          break

        case 'radio':
          if (event.data.id) {
            await telemetryService.saveRadioTransmission(event.data as RadioTransmission)
          }
          break

        case 'driver':
          await telemetryService.saveDriverBehaviorEvent(event.data as DriverBehaviorEvent)
          break

        case 'iot':
          await telemetryService.saveIoTSensorData(event.data as IoTSensorData)
          break

        // Other event types can be added here as needed
        case 'fuel':
        case 'maintenance':
        case 'cost':
        case 'dispatch':
          // These can be persisted to their respective tables
          break

        default:
          // Unknown event type - log but don't fail
          break
      }
    } catch (error) {
      console.error(`Failed to persist ${event.type} event:`, error)
    }
  }

  /**
   * Start all emulators
   */
  public async start(vehicleIds?: string[]): Promise<void> {
    if (this.isRunning) {
      throw new Error(`Emulators are already running`)
    }

    const vehiclesToStart = vehicleIds || Array.from(this.vehicles.keys())

    console.log(`Starting emulators for ${vehiclesToStart.length} vehicles...`)

    for (const vehicleId of vehiclesToStart) {
      const vehicle = this.vehicles.get(vehicleId)
      if (!vehicle) {
        console.warn(`Vehicle ${vehicleId} not found`)
        continue
      }

      await this.startVehicleEmulators(vehicle)

      // Register vehicle with dispatch emulator
      if (this.dispatchEmulator) {
        const unitNumber = `Unit-${vehicle.id.slice(0, 4).toUpperCase()}`
        this.dispatchEmulator.registerVehicle({
          id: vehicle.id,
          unitNumber,
          driverId: (vehicle as any).driver_id || (vehicle as any).driverId,
          currentLocation: vehicle.startingLocation
        })
      }
    }

    // Start dispatch emulator
    if (this.dispatchEmulator) {
      this.dispatchEmulator.start()
    }

    // Start inventory emulator
    if (this.inventoryEmulator) {
      await this.inventoryEmulator.start()
    }

    this.isRunning = true
    this.isPaused = false
    this.startTime = new Date()

    // Start stats collection
    this.startStatsCollection()

    this.broadcast({
      type: 'status',
      data: { status: 'running', timestamp: new Date() }
    })

    console.log('All emulators started successfully')
  }

  /**
   * Start emulators for a specific vehicle
   */
  private async startVehicleEmulators(vehicle: Vehicle): Promise<void> {
    const vehicleId = vehicle.id

    // GPS Emulator - Use production-grade RealisticGPSEmulator
    if (vehicle.features.includes('gps')) {
      const gpsEmulator = new RealisticGPSEmulator(vehicle, this.config, this.geofences)
      gpsEmulator.on('data', (data) => this.emit('gps', {
        type: 'gps',
        vehicleId,
        timestamp: new Date(),
        data
      }))
      this.gpsEmulators.set(vehicleId, gpsEmulator as unknown as GPSEmulator)
      await gpsEmulator.start()
    }

    // OBD-II Emulator - Use production-grade RealisticOBD2Emulator
    if (vehicle.features.includes('obd2')) {
      const obd2Emulator = new RealisticOBD2Emulator(vehicle, this.config)
      obd2Emulator.on('data', (data) => this.emit('obd2', {
        type: 'obd2',
        vehicleId,
        timestamp: new Date(),
        data
      }))
      this.obd2Emulators.set(vehicleId, obd2Emulator as unknown as OBD2Emulator)
      await obd2Emulator.start()
    }

    // Fuel Emulator
    const fuelEmulator = new FuelEmulator(vehicle, this.config)
    fuelEmulator.on('data', (data) => this.emit('fuel', {
      type: 'fuel',
      vehicleId,
      timestamp: new Date(),
      data
    }))
    this.fuelEmulators.set(vehicleId, fuelEmulator)
    await fuelEmulator.start()

    // Maintenance Emulator
    const maintenanceEmulator = new MaintenanceEmulator(vehicle, this.config)
    maintenanceEmulator.on('data', (data) => this.emit('maintenance', {
      type: 'maintenance',
      vehicleId,
      timestamp: new Date(),
      data
    }))
    this.maintenanceEmulators.set(vehicleId, maintenanceEmulator)
    await maintenanceEmulator.start()

    // Driver Behavior Emulator
    const driverEmulator = new DriverBehaviorEmulator(vehicle, this.config)
    driverEmulator.on('data', (data) => this.emit('driver', {
      type: 'driver',
      vehicleId,
      timestamp: new Date(),
      data
    }))
    this.driverEmulators.set(vehicleId, driverEmulator)
    await driverEmulator.start()

    // Route Emulator
    const routeEmulator = new RouteEmulator(vehicle, this.config, this.routes)
    routeEmulator.on('data', (data) => this.emit('route', {
      type: 'route',
      vehicleId,
      timestamp: new Date(),
      data
    }))
    this.routeEmulators.set(vehicleId, routeEmulator)
    await routeEmulator.start()

    // Cost Emulator (synthetic) - disabled by default.
    // Fleet-CTA demo environments should use DB-backed cost sources instead.
    if (process.env.ENABLE_COST_EMULATOR === 'true' && process.env.NODE_ENV !== 'production') {
      // Dynamic import avoids module side-effects (and any accidental construction) unless explicitly enabled.
      const { CostEmulator } = await import('./cost/CostEmulator')
      const costEmulator = new CostEmulator({ seedSyntheticData: true })
      costEmulator.on('data', (data) => this.emit('cost', {
        type: 'cost',
        vehicleId,
        timestamp: new Date(),
        data
      }))
      this.costEmulators.set(vehicleId, costEmulator)
      await costEmulator.start()
    }

    // IoT Emulator
    if (vehicle.features.includes('iot')) {
      const iotEmulator = new IoTEmulator(vehicle, this.config)
      iotEmulator.on('data', (data) => this.emit('iot', {
        type: 'iot',
        vehicleId,
        timestamp: new Date(),
        data
      }))
      this.iotEmulators.set(vehicleId, iotEmulator)
      await iotEmulator.start()
    }

    // EV Charging Emulator
    if (vehicle.type === 'ev' || vehicle.features?.includes('evcharging')) {
      const evChargingEmulator = new EVChargingEmulator({
        updateIntervalMs: this.config.emulators?.gps?.updateIntervalMs || 5000,
        maxConcurrentSessions: 10,
        stations: [], // Will be configured separately
        batteryDegradationRate: 2.0 // 2% per year
      })
      evChargingEmulator.registerVehicle({
        id: vehicleId,
        batteryCapacity: vehicle.batteryCapacity || 75, // kWh
        currentCharge: 80, // Start at 80%
        isElectric: true,
        batteryHealth: 100,
        chargingEfficiency: 0.90
      })
      evChargingEmulator.on('charging-started', (data) => this.emit('evcharging', {
        type: 'evcharging',
        event: 'charging-started',
        vehicleId,
        timestamp: new Date(),
        data
      }))
      evChargingEmulator.on('charging-progress', (data) => this.emit('evcharging', {
        type: 'evcharging',
        event: 'charging-progress',
        vehicleId,
        timestamp: new Date(),
        data
      }))
      evChargingEmulator.on('charging-complete', (data) => this.emit('evcharging', {
        type: 'evcharging',
        event: 'charging-complete',
        vehicleId,
        timestamp: new Date(),
        data
      }))
      this.evChargingEmulators.set(vehicleId, evChargingEmulator)
      evChargingEmulator.start()
    }

    // Video Telematics Emulator
    if (vehicle.features.includes('video') || vehicle.features.includes('dashcam')) {
      const videoTelematicsEmulator = new VideoTelematicsEmulator({
        updateIntervalMs: this.config.emulators?.gps?.updateIntervalMs || 5000,
        eventProbability: 0.05, // 5% chance per interval
        severityDistribution: {
          low: 0.60,
          medium: 0.25,
          high: 0.10,
          critical: 0.05
        },
        enableAIAnalysis: true,
        cameraViews: ['forward', 'driver']
      })
      videoTelematicsEmulator.registerVehicle({
        id: vehicleId,
        currentSpeed: 0,
        speedLimit: 55,
        location: vehicle.startingLocation
          ? { latitude: vehicle.startingLocation.lat, longitude: vehicle.startingLocation.lng }
          : { latitude: 0, longitude: 0 },
        driverId: '' // Driver ID not stored in vehicle, must be assigned separately
      })
      videoTelematicsEmulator.on('video-event-detected', (data) => this.emit('video-telematics', {
        type: 'video-telematics',
        event: 'event-detected',
        vehicleId,
        timestamp: new Date(),
        data
      }))
      videoTelematicsEmulator.on('video-event-cleared', (data) => this.emit('video-telematics', {
        type: 'video-telematics',
        event: 'event-cleared',
        vehicleId,
        timestamp: new Date(),
        data
      }))
      this.videoTelematicsEmulators.set(vehicleId, videoTelematicsEmulator)
      videoTelematicsEmulator.start()
    }

    // Radio/PTT Emulator
    if (vehicle.features.includes('radio') || vehicle.features.includes('ptt')) {
      const radioEmulator = new RadioEmulator(vehicle, this.config, {
        updateIntervalMs: this.config.emulators?.gps?.updateIntervalMs || 1000,
        enableAudioSimulation: true,
        enableInterference: true,
        pttTimeoutMs: 30000,
        emergencyPriority: true
      })

      // Listen to all radio events
      radioEmulator.on('ptt-press', (data) => this.emit('radio', {
        type: 'radio',
        event: 'ptt-press',
        vehicleId,
        timestamp: new Date(),
        data
      }))
      radioEmulator.on('ptt-release', (data) => this.emit('radio', {
        type: 'radio',
        event: 'ptt-release',
        vehicleId,
        timestamp: new Date(),
        data
      }))
      radioEmulator.on('transmission-start', (data) => this.emit('radio', {
        type: 'radio',
        event: 'transmission-start',
        vehicleId,
        timestamp: new Date(),
        data
      }))
      radioEmulator.on('transmission-end', (data) => this.emit('radio', {
        type: 'radio',
        event: 'transmission-end',
        vehicleId,
        timestamp: new Date(),
        data
      }))
      radioEmulator.on('channel-switch', (data) => this.emit('radio', {
        type: 'radio',
        event: 'channel-switch',
        vehicleId,
        timestamp: new Date(),
        data
      }))
      radioEmulator.on('emergency-activated', (data) => this.emit('radio', {
        type: 'radio',
        event: 'emergency-activated',
        vehicleId,
        timestamp: new Date(),
        data
      }))
      radioEmulator.on('audio-stream', (data) => this.emit('radio', {
        type: 'radio',
        event: 'audio-stream',
        vehicleId,
        timestamp: new Date(),
        data
      }))
      radioEmulator.on('channel-busy', (data) => this.emit('radio', {
        type: 'radio',
        event: 'channel-busy',
        vehicleId,
        timestamp: new Date(),
        data
      }))

      this.radioEmulators.set(vehicleId, radioEmulator)
      await radioEmulator.start()
    }

    this.stats.activeVehicles++

    // Create state entry
    this.states.set(vehicleId, {
      id: vehicleId,
      vehicleId,
      emulatorType: 'all',
      status: 'running',
      startedAt: new Date(),
      metrics: {
        eventsGenerated: 0,
        dataPointsGenerated: 0,
        errorsEncountered: 0,
        uptime: 0
      }
    })
  }

  /**
   * Stop all emulators
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Emulators are not running')
    }

    console.log('Stopping all emulators...')

    // Stop dispatch emulator
    if (this.dispatchEmulator) {
      this.dispatchEmulator.stop()
    }

    // Stop inventory emulator
    if (this.inventoryEmulator) {
      await this.inventoryEmulator.stop()
    }

    // Stop all emulator types
    await this.stopAllEmulators()

    this.isRunning = false
    this.isPaused = false
    this.startTime = null
    this.stats.activeVehicles = 0

    // Stop stats collection
    if (this.statsInterval) {
      clearInterval(this.statsInterval)
      this.statsInterval = null
    }

    this.broadcast({
      type: 'status',
      data: { status: 'stopped', timestamp: new Date() }
    })

    console.log('All emulators stopped successfully')
  }

  /**
   * Stop all emulator instances
   */
  private async stopAllEmulators(): Promise<void> {
    // Stop GPS emulators
    for (const emulator of this.gpsEmulators.values()) {
      await emulator.stop()
    }
    this.gpsEmulators.clear()

    // Stop OBD-II emulators
    for (const emulator of this.obd2Emulators.values()) {
      await emulator.stop()
    }
    this.obd2Emulators.clear()

    // Stop Fuel emulators
    for (const emulator of this.fuelEmulators.values()) {
      await emulator.stop()
    }
    this.fuelEmulators.clear()

    // Stop Maintenance emulators
    for (const emulator of this.maintenanceEmulators.values()) {
      await emulator.stop()
    }
    this.maintenanceEmulators.clear()

    // Stop Driver emulators
    for (const emulator of this.driverEmulators.values()) {
      await emulator.stop()
    }
    this.driverEmulators.clear()

    // Stop Route emulators
    for (const emulator of this.routeEmulators.values()) {
      await emulator.stop()
    }
    this.routeEmulators.clear()

    // Stop Cost emulators
    for (const emulator of this.costEmulators.values()) {
      await emulator.stop()
    }
    this.costEmulators.clear()

    // Stop IoT emulators
    for (const emulator of this.iotEmulators.values()) {
      await emulator.stop()
    }
    this.iotEmulators.clear()

    // Stop Radio emulators
    for (const emulator of this.radioEmulators.values()) {
      await emulator.stop()
    }
    this.radioEmulators.clear()

    this.states.clear()
  }

  /**
   * Pause all emulators
   */
  public async pause(): Promise<void> {
    if (!this.isRunning || this.isPaused) {
      throw new Error('Cannot pause: emulators not running or already paused')
    }

    console.log('Pausing all emulators...')

    // Pause all emulators
    for (const emulator of this.gpsEmulators.values()) {
      await emulator.pause()
    }
    for (const emulator of this.obd2Emulators.values()) {
      await emulator.pause()
    }
    // ... pause all other emulator types

    this.isPaused = true
    this.pauseTime = new Date()

    this.broadcast({
      type: 'status',
      data: { status: 'paused', timestamp: new Date() }
    })

    console.log('All emulators paused')
  }

  /**
   * Resume all emulators
   */
  public async resume(): Promise<void> {
    if (!this.isRunning || !this.isPaused) {
      throw new Error('Cannot resume: emulators not paused')
    }

    console.log('Resuming all emulators...')

    // Resume all emulators
    for (const emulator of this.gpsEmulators.values()) {
      await emulator.resume()
    }
    for (const emulator of this.obd2Emulators.values()) {
      await emulator.resume()
    }
    // ... resume all other emulator types

    this.isPaused = false
    this.pauseTime = null

    this.broadcast({
      type: 'status',
      data: { status: 'running', timestamp: new Date() }
    })

    console.log(`All emulators resumed`)
  }

  /**
   * Load and run a scenario
   */
  public async runScenario(scenarioId: string): Promise<void> {
    const scenario = this.scenarios.get(scenarioId)
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`)
    }

    console.log(`Running scenario: ${scenario.name}`)

    this.currentScenario = scenarioId

    // Apply scenario configuration
    // Select vehicles based on scenario
    const vehicleIds = Array.from(this.vehicles.keys()).slice(0, scenario.activeVehicles)

    // Start emulators with scenario settings
    await this.start(vehicleIds)

    // Apply scenario modifiers
    if (scenario.modifiers) {
      this.applyScenarioModifiers(scenario.modifiers)
    }

    this.broadcast({
      type: 'scenario',
      data: { scenario: scenarioId, name: scenario.name, timestamp: new Date() }
    })
  }

  /**
   * Apply scenario modifiers to emulators
   */
  private applyScenarioModifiers(modifiers: Record<string, any>): void {
    // Apply modifiers to all active emulators
    // This would adjust speed, fuel consumption, etc.
    console.log('Applying scenario modifiers:', modifiers)
  }

  /**
   * Start stats collection
   */
  private startStatsCollection(): void {
    this.statsInterval = setInterval(() => {
      this.updateStats()

      this.broadcast({
        type: 'stats',
        data: this.stats
      })
    }, 5000) // Update every 5 seconds
  }

  /**
   * Update statistics
   */
  private updateStats(): void {
    if (this.startTime) {
      this.stats.uptime = Date.now() - this.startTime.getTime()
    }

    // Calculate events per second
    const recentEvents = this.eventQueue.filter(
      e => Date.now() - e.timestamp.getTime() < 1000
    )
    this.stats.eventsPerSecond = recentEvents.length

    // Memory usage
    const usage = process.memoryUsage()
    this.stats.memoryUsage = usage.heapUsed / 1024 / 1024 // MB

    // Clear old events from queue (keep last 1000)
    if (this.eventQueue.length > 1000) {
      this.eventQueue = this.eventQueue.slice(-1000)
    }
  }

  /**
   * Get current status
   */
  public getStatus(): any {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      currentScenario: this.currentScenario,
      startTime: this.startTime,
      pauseTime: this.pauseTime,
      stats: this.stats,
      vehicles: {
        total: this.stats.totalVehicles,
        active: this.stats.activeVehicles
      },
      emulators: {
        gps: this.gpsEmulators.size,
        obd2: this.obd2Emulators.size,
        fuel: this.fuelEmulators.size,
        maintenance: this.maintenanceEmulators.size,
        driver: this.driverEmulators.size,
        route: this.routeEmulators.size,
        cost: this.costEmulators.size,
        iot: this.iotEmulators.size,
        radio: this.radioEmulators.size
      }
    }
  }

  /**
   * Get vehicle telemetry data
   */
  public getVehicleTelemetry(vehicleId: string): any {
    const state = this.states.get(vehicleId)
    if (!state) {
      return null
    }

    return {
      vehicleId,
      state,
      gps: this.gpsEmulators.get(vehicleId)?.getCurrentState(),
      obd2: this.obd2Emulators.get(vehicleId)?.getCurrentState(),
      fuel: this.fuelEmulators.get(vehicleId)?.getCurrentState(),
      driver: this.driverEmulators.get(vehicleId)?.getCurrentState(),
      iot: this.iotEmulators.get(vehicleId)?.getCurrentState()
    }
  }

  /**
   * Get inventory data
   */
  public getInventoryData(): any {
    if (!this.inventoryEmulator) {
      return null
    }

    return {
      stats: this.inventoryEmulator.getStats(),
      lowStockItems: this.inventoryEmulator.getLowStockItems(),
      lowStockAlerts: this.inventoryEmulator.getLowStockAlerts(),
      recentTransactions: this.inventoryEmulator.getTransactions(20),
      currentState: this.inventoryEmulator.getCurrentState()
    }
  }

  /**
   * Get inventory items by category
   */
  public getInventoryByCategory(category: string): any {
    if (!this.inventoryEmulator) {
      return []
    }

    return this.inventoryEmulator.getItemsByCategory(category as any)
  }

  /**
   * Search inventory items
   */
  public searchInventory(sku: string): any {
    if (!this.inventoryEmulator) {
      return []
    }

    return this.inventoryEmulator.getItemsBySKU(sku)
  }

  /**
   * Cleanup and shutdown
   */
  public async shutdown(): Promise<void> {
    console.log('Shutting down EmulatorOrchestrator...')

    if (this.isRunning) {
      await this.stop()
    }

    if (this.wss) {
      this.wss.close()
    }

    this.removeAllListeners()

    console.log('EmulatorOrchestrator shutdown complete')
  }

  /**
   * Get singleton instance
   */
  private static instance: EmulatorOrchestrator | null = null

  public static getInstance(configPath?: string): EmulatorOrchestrator {
    if (!EmulatorOrchestrator.instance) {
      EmulatorOrchestrator.instance = new EmulatorOrchestrator(configPath)
    }
    return EmulatorOrchestrator.instance
  }
}
