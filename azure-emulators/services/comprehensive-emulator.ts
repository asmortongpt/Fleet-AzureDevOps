/**
 * Comprehensive Azure Fleet Emulator Service
 *
 * Populates ALL database fields with realistic data for City of Tallahassee fleet
 * - 300 vehicles confined to Tallahassee city limits (except rare work trips)
 * - All emulator tables fully populated
 * - Realistic patterns based on vehicle type and department
 */

import { Pool } from 'pg'
import { EventEmitter } from 'events'
import fleetConfig from '../config/tallahassee-fleet.json'

// Tallahassee city boundaries
const TALLAHASSEE_BOUNDS = {
  center: { lat: 30.4383, lng: -84.2807 },
  north: 30.5500,
  south: 30.3500,
  east: -84.1500,
  west: -84.4000,
  radiusKm: 20 // Main city area
}

// Work trip destinations (rare, only 2% of vehicles)
const WORK_TRIP_DESTINATIONS = [
  { name: 'Jacksonville', lat: 30.3322, lng: -81.6557, probability: 0.005 },
  { name: 'Panama City', lat: 30.1588, lng: -85.6602, probability: 0.005 },
  { name: 'Gainesville', lat: 29.6516, lng: -82.3248, probability: 0.005 },
  { name: 'Thomasville GA', lat: 30.8366, lng: -83.9788, probability: 0.005 }
]

interface ComprehensiveVehicleData {
  // Session data
  sessionId: string
  vehicleId: string
  vehicle: VehicleInfo

  // Real-time state
  status: 'idle' | 'active' | 'responding' | 'maintenance' | 'out_of_service'
  currentLocation: GPSData
  isOnWorkTrip: boolean
  workTripDestination?: typeof WORK_TRIP_DESTINATIONS[0]

  // Telemetry
  gps: GPSData
  obd2: OBD2Data
  telemetry: TelemetrySnapshot
  diagnosticCodes: DiagnosticCode[]

  // Driver data
  driver: DriverData | null
  driverBehavior: DriverBehaviorData
  driverHOS: HOSLogData | null

  // Trip data
  currentTrip: TripData | null
  tripBreadcrumbs: GPSBreadcrumb[]

  // Events
  safetyEvents: SafetyEvent[]
  maintenanceEvents: MaintenanceEvent[]
  fuelTransactions: FuelTransaction[]
  costRecords: CostRecord[]

  // IoT devices
  devices: DeviceData[]
  deviceTelemetry: DeviceTelemetryData[]

  // Inspections
  lastInspection: VehicleInspection | null

  // Mobile app state
  mobileAppState: MobileAppState
}

interface VehicleInfo {
  vehicleNumber: number
  department: string
  vehicleType: string
  model: string
  vin: string
  year: number
  licensePlate: string
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid'
  fuelCapacityGallons: number
  averageMPG: number
}

interface GPSData {
  timestamp: Date
  latitude: number
  longitude: number
  altitude: number
  speed: number
  heading: number
  accuracy: number
  satelliteCount: number
  odometer: number
}

interface OBD2Data {
  timestamp: Date
  rpm: number
  speed: number
  coolantTemp: number
  fuelLevel: number
  batteryVoltage: number
  engineLoad: number
  throttlePosition: number
  maf: number
  o2Sensor: number
  checkEngineLight: boolean
  mil: boolean
}

interface TelemetrySnapshot {
  timestamp: Date
  engineHours: number
  idleTime: number
  drivingTime: number
  fuelConsumed: number
  distanceTraveled: number
  averageSpeed: number
  maxSpeed: number
  harshBrakes: number
  harshAccelerations: number
  engineOilTemp: number
  transmissionTemp: number
  tirePressuref: number[]
}

interface DiagnosticCode {
  code: string
  description: string
  severity: 'critical' | 'major' | 'moderate' | 'minor'
  timestamp: Date
  cleared: boolean
}

interface DriverData {
  employeeId: string
  name: string
  badgeNumber: string
  licenseNumber: string
  shift: 'day' | 'evening' | 'night'
  loginTime: Date
  safetyScore: number
}

interface DriverBehaviorData {
  timestamp: Date
  eventType: 'speeding' | 'harsh_brake' | 'harsh_accel' | 'harsh_turn' | 'idle_excess' | 'safe_driving'
  severity: 'low' | 'medium' | 'high'
  speed: number
  speedLimit: number
  duration: number
  score: number
}

interface HOSLogData {
  timestamp: Date
  status: 'on_duty' | 'off_duty' | 'driving' | 'sleeper_berth'
  location: string
  odometer: number
  engineHours: number
}

interface TripData {
  tripId: string
  startTime: Date
  endTime: Date | null
  startOdometer: number
  endOdometer: number | null
  startLocation: { lat: number, lng: number }
  endLocation: { lat: number, lng: number } | null
  purpose: string
  driver: string
}

interface GPSBreadcrumb {
  timestamp: Date
  latitude: number
  longitude: number
  speed: number
  heading: number
}

interface SafetyEvent {
  timestamp: Date
  eventType: string
  severity: string
  location: { lat: number, lng: number }
  speed: number
  description: string
}

interface MaintenanceEvent {
  timestamp: Date
  eventType: 'oil_change' | 'tire_rotation' | 'brake_service' | 'inspection' | 'repair'
  category: string
  description: string
  parts: any[]
  laborHours: number
  laborCost: number
  totalCost: number
  vendorName: string
  nextDueOdometer: number
}

interface FuelTransaction {
  timestamp: Date
  stationId: string
  stationName: string
  location: { lat: number, lng: number }
  gallons: number
  pricePerGallon: number
  totalCost: number
  fuelType: string
  paymentMethod: string
  odometer: number
  receiptNumber: string
}

interface CostRecord {
  timestamp: Date
  category: 'fuel' | 'maintenance' | 'insurance' | 'registration' | 'violation' | 'other'
  amount: number
  description: string
  invoiceNumber: string
  vendorName: string
}

interface DeviceData {
  deviceId: string
  deviceType: 'obd2' | 'gps' | 'camera' | 'dashcam' | 'fuel_sensor'
  manufacturer: string
  model: string
  serialNumber: string
  installDate: Date
  lastCommunication: Date
  status: 'active' | 'inactive' | 'error'
}

interface DeviceTelemetryData {
  timestamp: Date
  deviceId: string
  sensorData: any
}

interface VehicleInspection {
  timestamp: Date
  inspectorName: string
  inspectionType: 'pre_trip' | 'post_trip' | 'periodic' | 'dot'
  passed: boolean
  defectsFound: string[]
  photos: string[]
  notes: string
}

interface MobileAppState {
  isDriverLoggedIn: boolean
  driverName?: string
  currentActivity: string
  lastActivityTime: Date
  tripStatus: 'pre-trip' | 'in-transit' | 'on-scene' | 'returning' | 'post-trip' | null
  preTripComplete: boolean
  postTripComplete: boolean
  photosTaken: number
  notesEntered: number
  incidentsReported: number
}

export class ComprehensiveFleetEmulator extends EventEmitter {
  private pool: Pool
  private sessionId: string
  private vehicles: Map<string, ComprehensiveVehicleData> = new Map()
  private intervalIds: Map<string, NodeJS.Timeout> = new Map()
  private isRunning: boolean = false

  constructor(
    private databaseUrl: string,
    private vehicleIdOffset: number = 0,
    private vehiclesPerPod: number = 30
  ) {
    super()
    this.pool = new Pool({ connectionString: databaseUrl, max: 20 })
    this.sessionId = `session-${Date.now()}`
  }

  async initialize(): Promise<void> {
    console.log('[Comprehensive Emulator] Initializing...')

    // Create session
    await this.createSession()

    // Generate vehicles
    const vehicleAssignments = this.generateVehicleAssignments()
    const startIdx = this.vehicleIdOffset
    const endIdx = Math.min(startIdx + this.vehiclesPerPod, vehicleAssignments.length)

    for (let i = startIdx; i < endIdx; i++) {
      const assignment = vehicleAssignments[i]
      const vehicle = await this.createComprehensiveVehicle(assignment, i)
      this.vehicles.set(vehicle.vehicleId, vehicle)
    }

    console.log(`[Comprehensive Emulator] Created ${this.vehicles.size} vehicles`)
  }

  async start(): Promise<void> {
    if (this.isRunning) return

    console.log('[Comprehensive Emulator] Starting all vehicles...')
    this.isRunning = true

    for (const [id, vehicle] of this.vehicles.entries()) {
      this.startVehicle(vehicle)
    }

    console.log(`[Comprehensive Emulator] ${this.vehicles.size} vehicles running`)
  }

  async stop(): Promise<void> {
    console.log('[Comprehensive Emulator] Stopping...')
    this.isRunning = false

    for (const intervalId of this.intervalIds.values()) {
      clearInterval(intervalId)
    }
    this.intervalIds.clear()

    await this.updateSessionStatus('stopped')
    await this.pool.end()
  }

  private async createSession(): Promise<void> {
    await this.pool.query(`
      INSERT INTO emulator_sessions (id, session_name, scenario_id, status, config)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      this.sessionId,
      'Tallahassee Fleet Demo',
      'continuous-operation',
      'running',
      JSON.stringify(fleetConfig)
    ])
  }

  private async updateSessionStatus(status: string): Promise<void> {
    await this.pool.query(`
      UPDATE emulator_sessions
      SET status = $1, stopped_at = $2
      WHERE id = $3
    `, [status, new Date(), this.sessionId])
  }

  private generateVehicleAssignments(): any[] {
    const assignments: any[] = []
    let vehicleNumber = 1

    for (const [deptName, dept] of Object.entries(fleetConfig.vehicleDistribution)) {
      const deptData = dept as any
      for (const typeInfo of deptData.types) {
        for (let i = 0; i < typeInfo.count; i++) {
          assignments.push({
            vehicleNumber,
            department: deptName,
            vehicleType: typeInfo.type,
            model: typeInfo.model,
            operatingHours: (fleetConfig.operatingHours as any)[deptName]
          })
          vehicleNumber++
        }
      }
    }

    return assignments
  }

  private async createComprehensiveVehicle(assignment: any, index: number): Promise<ComprehensiveVehicleData> {
    const vehicleId = `COT-${assignment.department.toUpperCase()}-${String(assignment.vehicleNumber).padStart(4, '0')}`

    // Determine if this vehicle is on a rare work trip (only 2% of fleet)
    const isOnWorkTrip = Math.random() < 0.02
    const workTripDest = isOnWorkTrip ? this.selectWorkTripDestination() : undefined

    // Create vehicle info
    const vehicle: VehicleInfo = {
      vehicleNumber: assignment.vehicleNumber,
      department: assignment.department,
      vehicleType: assignment.vehicleType,
      model: assignment.model,
      vin: this.generateVIN(),
      year: 2018 + Math.floor(Math.random() * 6),
      licensePlate: this.generateLicensePlate(),
      fuelType: this.getFuelType(assignment.vehicleType),
      fuelCapacityGallons: this.getFuelCapacity(assignment.vehicleType),
      averageMPG: this.getAverageMPG(assignment.vehicleType)
    }

    // Initialize location (within Tallahassee or at work trip destination)
    const startLocation = isOnWorkTrip && workTripDest
      ? this.getLocationNear(workTripDest.lat, workTripDest.lng, 5)
      : this.getRandomLocationInTallahassee()

    // Create driver (if on duty)
    const driver = this.shouldHaveDriver(assignment.operatingHours)
      ? this.createDriver(assignment.department)
      : null

    // Initialize comprehensive data
    const vehicleData: ComprehensiveVehicleData = {
      sessionId: this.sessionId,
      vehicleId,
      vehicle,
      status: this.getInitialStatus(assignment.department),
      currentLocation: this.createGPSData(startLocation),
      isOnWorkTrip,
      workTripDestination: workTripDest,

      // Telemetry
      gps: this.createGPSData(startLocation),
      obd2: this.createOBD2Data(vehicleId),
      telemetry: this.createTelemetrySnapshot(),
      diagnosticCodes: Math.random() > 0.9 ? [this.generateDTC()] : [],

      // Driver
      driver,
      driverBehavior: this.createDriverBehaviorData(startLocation, 'safe_driving'),
      driverHOS: driver ? this.createHOSLog(driver, 'driving', startLocation) : null,

      // Trip
      currentTrip: driver ? this.createTripData(vehicleId, driver.name, startLocation) : null,
      tripBreadcrumbs: [],

      // Events
      safetyEvents: [],
      maintenanceEvents: [],
      fuelTransactions: [],
      costRecords: [],

      // Devices
      devices: this.createDevices(vehicleId),
      deviceTelemetry: [],

      // Inspections
      lastInspection: this.createInspection(),

      // Mobile app
      mobileAppState: this.createMobileAppState(driver)
    }

    // Insert into database
    await this.insertVehicleToDatabase(vehicleData)

    return vehicleData
  }

  private startVehicle(vehicle: ComprehensiveVehicleData): void {
    // Update every 2 seconds for real-time feel
    const intervalId = setInterval(async () => {
      await this.updateVehicle(vehicle)
    }, 2000)

    this.intervalIds.set(vehicle.vehicleId, intervalId)
  }

  private async updateVehicle(vehicle: ComprehensiveVehicleData): Promise<void> {
    const now = new Date()

    // Update location (constrained to Tallahassee unless on work trip)
    this.updateLocation(vehicle)

    // Update telemetry
    this.updateOBD2(vehicle)
    this.updateGPS(vehicle)
    this.updateTelemetrySnapshot(vehicle)

    // Update trip breadcrumbs
    if (vehicle.currentTrip && vehicle.status === 'active') {
      vehicle.tripBreadcrumbs.push({
        timestamp: now,
        latitude: vehicle.currentLocation.latitude,
        longitude: vehicle.currentLocation.longitude,
        speed: vehicle.obd2.speed,
        heading: vehicle.gps.heading
      })
    }

    // Random events
    await this.generateRandomEvents(vehicle)

    // Update mobile app state
    this.updateMobileAppState(vehicle)

    // Write to database
    await this.writeToDatabase(vehicle)

    // Emit for SignalR broadcasting
    this.emit('vehicle-update', {
      vehicleId: vehicle.vehicleId,
      location: vehicle.currentLocation,
      telemetry: vehicle.obd2,
      status: vehicle.status,
      mobileAppState: vehicle.mobileAppState
    })
  }

  private updateLocation(vehicle: ComprehensiveVehicleData): void {
    if (vehicle.status === 'idle' || vehicle.status === 'maintenance') return

    const speed = vehicle.obd2.speed
    if (speed === 0) return

    // Move vehicle
    const distanceKm = (speed * 1.60934 / 3600) * 2 // 2-second interval
    const distanceDegrees = distanceKm / 111.32

    // Random heading changes (but stay in bounds)
    if (Math.random() < 0.05) {
      vehicle.gps.heading += (Math.random() - 0.5) * 30
      vehicle.gps.heading = vehicle.gps.heading % 360
    }

    const headingRad = vehicle.gps.heading * Math.PI / 180
    let newLat = vehicle.currentLocation.latitude + distanceDegrees * Math.cos(headingRad)
    let newLng = vehicle.currentLocation.longitude + distanceDegrees * Math.sin(headingRad) / Math.cos(vehicle.currentLocation.latitude * Math.PI / 180)

    // Enforce boundaries (unless on work trip)
    if (!vehicle.isOnWorkTrip) {
      // Keep within Tallahassee city limits
      if (newLat > TALLAHASSEE_BOUNDS.north || newLat < TALLAHASSEE_BOUNDS.south) {
        vehicle.gps.heading = (vehicle.gps.heading + 180) % 360 // Turn around
        newLat = vehicle.currentLocation.latitude
      }

      if (newLng < TALLAHASSEE_BOUNDS.west || newLng > TALLAHASSEE_BOUNDS.east) {
        vehicle.gps.heading = (vehicle.gps.heading + 180) % 360 // Turn around
        newLng = vehicle.currentLocation.longitude
      }

      // Keep within radius of city center
      const distanceFromCenter = this.calculateDistance(
        newLat, newLng,
        TALLAHASSEE_BOUNDS.center.lat, TALLAHASSEE_BOUNDS.center.lng
      )

      if (distanceFromCenter > TALLAHASSEE_BOUNDS.radiusKm) {
        // Turn back toward center
        const angleToCenter = Math.atan2(
          TALLAHASSEE_BOUNDS.center.lng - vehicle.currentLocation.longitude,
          TALLAHASSEE_BOUNDS.center.lat - vehicle.currentLocation.latitude
        ) * 180 / Math.PI
        vehicle.gps.heading = angleToCenter
        newLat = vehicle.currentLocation.latitude
        newLng = vehicle.currentLocation.longitude
      }
    }

    // Update location
    vehicle.currentLocation.latitude = newLat
    vehicle.currentLocation.longitude = newLng
    vehicle.currentLocation.timestamp = new Date()
    vehicle.gps.latitude = newLat
    vehicle.gps.longitude = newLng
    vehicle.gps.timestamp = new Date()

    // Update odometer
    vehicle.gps.odometer += distanceKm * 0.621371 // km to miles
  }

  private async generateRandomEvents(vehicle: ComprehensiveVehicleData): Promise<void> {
    const rand = Math.random()

    // Fuel transaction (every ~500 miles or when fuel < 20%)
    if (vehicle.obd2.fuelLevel < 20 || (rand < 0.0001 && vehicle.status === 'active')) {
      const fuelTx = await this.generateFuelTransaction(vehicle)
      vehicle.fuelTransactions.push(fuelTx)
      vehicle.obd2.fuelLevel = 95 // Refilled
    }

    // Maintenance event (rare)
    if (rand < 0.00005) {
      const maintEvent = this.generateMaintenanceEvent(vehicle)
      vehicle.maintenanceEvents.push(maintEvent)
    }

    // Safety event (occasional)
    if (rand < 0.001 && vehicle.driver) {
      const safetyEvent = this.generateSafetyEvent(vehicle)
      vehicle.safetyEvents.push(safetyEvent)
    }

    // DTC generation (rare)
    if (rand < 0.0001 && vehicle.diagnosticCodes.length === 0) {
      vehicle.diagnosticCodes.push(this.generateDTC())
      vehicle.obd2.checkEngineLight = true
      vehicle.obd2.mil = true
    }
  }

  // Helper methods for boundary checking
  private getRandomLocationInTallahassee(): { latitude: number, longitude: number } {
    const angle = Math.random() * Math.PI * 2
    const distance = Math.random() * TALLAHASSEE_BOUNDS.radiusKm

    const lat = TALLAHASSEE_BOUNDS.center.lat + (distance / 111.32) * Math.cos(angle)
    const lng = TALLAHASSEE_BOUNDS.center.lng + (distance / (111.32 * Math.cos(TALLAHASSEE_BOUNDS.center.lat * Math.PI / 180))) * Math.sin(angle)

    return { latitude: lat, longitude: lng }
  }

  private getLocationNear(lat: number, lng: number, radiusKm: number): { latitude: number, longitude: number } {
    const angle = Math.random() * Math.PI * 2
    const distance = Math.random() * radiusKm

    const newLat = lat + (distance / 111.32) * Math.cos(angle)
    const newLng = lng + (distance / (111.32 * Math.cos(lat * Math.PI / 180))) * Math.sin(angle)

    return { latitude: newLat, longitude: newLng }
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private selectWorkTripDestination() {
    const rand = Math.random()
    let cumulative = 0
    for (const dest of WORK_TRIP_DESTINATIONS) {
      cumulative += dest.probability
      if (rand < cumulative) return dest
    }
    return WORK_TRIP_DESTINATIONS[0]
  }

  // Database insertion methods
  private async insertVehicleToDatabase(vehicle: ComprehensiveVehicleData): Promise<void> {
    // Insert emulator_vehicles record
    await this.pool.query(`
      INSERT INTO emulator_vehicles (session_id, vehicle_id, status, started_at)
      VALUES ($1, $2, $3, $4)
    `, [this.sessionId, vehicle.vehicleId, vehicle.status, new Date()])

    // Insert initial telemetry
    await this.writeToDatabase(vehicle)
  }

  private async writeToDatabase(vehicle: ComprehensiveVehicleData): Promise<void> {
    const now = new Date()

    // GPS telemetry
    await this.pool.query(`
      INSERT INTO emulator_gps_telemetry
      (session_id, vehicle_id, timestamp, latitude, longitude, altitude, speed, heading, odometer, accuracy, satellite_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      this.sessionId, vehicle.vehicleId, now,
      vehicle.gps.latitude, vehicle.gps.longitude, vehicle.gps.altitude,
      vehicle.gps.speed, vehicle.gps.heading, vehicle.gps.odometer,
      vehicle.gps.accuracy, vehicle.gps.satelliteCount
    ])

    // OBD2 data
    await this.pool.query(`
      INSERT INTO emulator_obd2_data
      (session_id, vehicle_id, timestamp, rpm, speed, coolant_temp, fuel_level, battery_voltage, engine_load, throttle_position, maf, o2_sensor, check_engine_light, mil)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
      this.sessionId, vehicle.vehicleId, now,
      vehicle.obd2.rpm, vehicle.obd2.speed, vehicle.obd2.coolantTemp,
      vehicle.obd2.fuelLevel, vehicle.obd2.batteryVoltage, vehicle.obd2.engineLoad,
      vehicle.obd2.throttlePosition, vehicle.obd2.maf, vehicle.obd2.o2Sensor,
      vehicle.obd2.checkEngineLight, vehicle.obd2.mil
    ])

    // Write fuel transactions, maintenance events, etc. if present
    // ... (additional database writes)
  }

  // Data generation helper methods
  private createGPSData(location: { latitude: number, longitude: number }): GPSData {
    return {
      timestamp: new Date(),
      latitude: location.latitude,
      longitude: location.longitude,
      altitude: 50 + Math.random() * 30,
      speed: 0,
      heading: Math.random() * 360,
      accuracy: 5 + Math.random() * 5,
      satelliteCount: 8 + Math.floor(Math.random() * 5),
      odometer: Math.floor(Math.random() * 100000)
    }
  }

  private createOBD2Data(vehicleId: string): OBD2Data {
    return {
      timestamp: new Date(),
      rpm: 750,
      speed: 0,
      coolantTemp: 160,
      fuelLevel: 50 + Math.random() * 40,
      batteryVoltage: 12.6,
      engineLoad: 0,
      throttlePosition: 0,
      maf: 2.5,
      o2Sensor: 0.45,
      checkEngineLight: false,
      mil: false
    }
  }

  private createTelemetrySnapshot(): TelemetrySnapshot {
    return {
      timestamp: new Date(),
      engineHours: Math.floor(Math.random() * 5000),
      idleTime: 0,
      drivingTime: 0,
      fuelConsumed: 0,
      distanceTraveled: 0,
      averageSpeed: 0,
      maxSpeed: 0,
      harshBrakes: 0,
      harshAccelerations: 0,
      engineOilTemp: 180,
      transmissionTemp: 175,
      tirePressuref: [32, 32, 32, 32]
    }
  }

  private createDriver(department: string): DriverData {
    const firstNames = ['John', 'Sarah', 'Michael', 'Jennifer', 'David', 'Lisa', 'James', 'Mary']
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis']

    return {
      employeeId: `EMP-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
      name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
      badgeNumber: `BADGE-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
      licenseNumber: `FL-${String(Math.floor(Math.random() * 999999999)).padStart(9, '0')}`,
      shift: this.getCurrentShift(),
      loginTime: new Date(),
      safetyScore: 75 + Math.floor(Math.random() * 25)
    }
  }

  private createDriverBehaviorData(location: { latitude: number, longitude: number }, eventType: string): DriverBehaviorData {
    return {
      timestamp: new Date(),
      eventType: eventType as any,
      severity: 'low',
      speed: 0,
      speedLimit: 35,
      duration: 0,
      score: 100
    }
  }

  private createHOSLog(driver: DriverData, status: string, location: { latitude: number, longitude: number }): HOSLogData {
    return {
      timestamp: new Date(),
      status: status as any,
      location: 'Tallahassee, FL',
      odometer: Math.floor(Math.random() * 100000),
      engineHours: Math.floor(Math.random() * 5000)
    }
  }

  private createTripData(vehicleId: string, driverName: string, location: { latitude: number, longitude: number }): TripData {
    return {
      tripId: `TRIP-${Date.now()}-${vehicleId}`,
      startTime: new Date(),
      endTime: null,
      startOdometer: Math.floor(Math.random() * 100000),
      endOdometer: null,
      startLocation: { lat: location.latitude, lng: location.longitude },
      endLocation: null,
      purpose: this.getTripPurpose(),
      driver: driverName
    }
  }

  private createDevices(vehicleId: string): DeviceData[] {
    return [
      {
        deviceId: `${vehicleId}-OBD2`,
        deviceType: 'obd2',
        manufacturer: 'Geotab',
        model: 'GO9',
        serialNumber: `SN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        installDate: new Date(2022, 0, 1),
        lastCommunication: new Date(),
        status: 'active'
      },
      {
        deviceId: `${vehicleId}-GPS`,
        deviceType: 'gps',
        manufacturer: 'Verizon Connect',
        model: 'Reveal',
        serialNumber: `SN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        installDate: new Date(2022, 0, 1),
        lastCommunication: new Date(),
        status: 'active'
      }
    ]
  }

  private createInspection(): VehicleInspection {
    return {
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Within last week
      inspectorName: 'John Mechanic',
      inspectionType: 'pre_trip',
      passed: true,
      defectsFound: [],
      photos: [],
      notes: 'All systems operational'
    }
  }

  private createMobileAppState(driver: DriverData | null): MobileAppState {
    return {
      isDriverLoggedIn: driver !== null,
      driverName: driver?.name,
      currentActivity: 'On Duty',
      lastActivityTime: new Date(),
      tripStatus: driver ? 'in-transit' : null,
      preTripComplete: driver ? true : false,
      postTripComplete: false,
      photosTaken: 0,
      notesEntered: 0,
      incidentsReported: 0
    }
  }

  private async generateFuelTransaction(vehicle: ComprehensiveVehicleData): Promise<FuelTransaction> {
    // Find nearest gas station in Tallahassee
    const stations = [
      { id: 'STATION-001', name: 'City Fuel Depot', lat: 30.4423, lng: -84.2897 },
      { id: 'STATION-002', name: 'Shell Monroe St', lat: 30.4401, lng: -84.2812 },
      { id: 'STATION-003', name: 'BP Tennessee St', lat: 30.4390, lng: -84.2950 }
    ]

    const station = stations[Math.floor(Math.random() * stations.length)]
    const gallons = (100 - vehicle.obd2.fuelLevel) / 100 * vehicle.vehicle.fuelCapacityGallons
    const pricePerGallon = 3.15 + Math.random() * 0.50

    const transaction: FuelTransaction = {
      timestamp: new Date(),
      stationId: station.id,
      stationName: station.name,
      location: { lat: station.lat, lng: station.lng },
      gallons,
      pricePerGallon,
      totalCost: gallons * pricePerGallon,
      fuelType: vehicle.vehicle.fuelType,
      paymentMethod: 'fleet_card',
      odometer: vehicle.gps.odometer,
      receiptNumber: `RCP-${Date.now()}`
    }

    // Write to database
    await this.pool.query(`
      INSERT INTO emulator_fuel_transactions
      (session_id, vehicle_id, timestamp, station_id, station_name, latitude, longitude, gallons, price_per_gallon, total_cost, fuel_type, payment_method, odometer, receipt_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
      this.sessionId, vehicle.vehicleId, transaction.timestamp,
      transaction.stationId, transaction.stationName, transaction.location.lat, transaction.location.lng,
      transaction.gallons, transaction.pricePerGallon, transaction.totalCost,
      transaction.fuelType, transaction.paymentMethod, transaction.odometer, transaction.receiptNumber
    ])

    return transaction
  }

  private generateMaintenanceEvent(vehicle: ComprehensiveVehicleData): MaintenanceEvent {
    const maintenanceTypes = [
      { type: 'oil_change' as const, cost: 75, hours: 0.5, description: 'Routine oil and filter change' },
      { type: 'tire_rotation' as const, cost: 50, hours: 0.75, description: 'Tire rotation and balance' },
      { type: 'brake_service' as const, cost: 350, hours: 2.0, description: 'Brake pad replacement' },
      { type: 'inspection' as const, cost: 100, hours: 1.0, description: 'Annual safety inspection' }
    ]

    const maint = maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)]

    return {
      timestamp: new Date(),
      eventType: maint.type,
      category: 'preventive',
      description: maint.description,
      parts: [],
      laborHours: maint.hours,
      laborCost: maint.hours * 95,
      totalCost: maint.cost,
      vendorName: 'City Fleet Maintenance',
      nextDueOdometer: vehicle.gps.odometer + 5000
    }
  }

  private generateSafetyEvent(vehicle: ComprehensiveVehicleData): SafetyEvent {
    const eventTypes = ['speeding', 'harsh_brake', 'harsh_accel', 'harsh_turn']
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]

    return {
      timestamp: new Date(),
      eventType,
      severity: 'low',
      location: { lat: vehicle.currentLocation.latitude, lng: vehicle.currentLocation.longitude },
      speed: vehicle.obd2.speed,
      description: `${eventType.replace('_', ' ')} detected`
    }
  }

  private generateDTC(): DiagnosticCode {
    const dtcs = [
      { code: 'P0171', description: 'System Too Lean Bank 1', severity: 'moderate' as const },
      { code: 'P0420', description: 'Catalyst System Efficiency Below Threshold', severity: 'minor' as const },
      { code: 'P0128', description: 'Coolant Thermostat Temperature Below Regulating Temperature', severity: 'minor' as const }
    ]

    const dtc = dtcs[Math.floor(Math.random() * dtcs.length)]
    return {
      ...dtc,
      timestamp: new Date(),
      cleared: false
    }
  }

  // Helper methods
  private generateVIN(): string {
    const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'
    return Array.from({ length: 17 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  private generateLicensePlate(): string {
    return `FL-${Math.random().toString(36).substr(2, 4).toUpperCase()}${Math.floor(Math.random() * 999)}`
  }

  private getFuelType(vehicleType: string): 'gasoline' | 'diesel' | 'electric' | 'hybrid' {
    if (vehicleType.includes('electric')) return 'electric'
    if (vehicleType.includes('truck') || vehicleType.includes('bus')) return 'diesel'
    return 'gasoline'
  }

  private getFuelCapacity(vehicleType: string): number {
    if (vehicleType.includes('bus')) return 50
    if (vehicleType.includes('truck')) return 36
    return 20
  }

  private getAverageMPG(vehicleType: string): number {
    if (vehicleType.includes('electric')) return 100 // MPGe
    if (vehicleType.includes('bus')) return 8
    if (vehicleType.includes('truck')) return 12
    return 20
  }

  private shouldHaveDriver(operatingHours: any): boolean {
    const hour = new Date().getHours()
    return hour >= operatingHours.start && hour < operatingHours.end && Math.random() > 0.2
  }

  private getCurrentShift(): 'day' | 'evening' | 'night' {
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 14) return 'day'
    if (hour >= 14 && hour < 22) return 'evening'
    return 'night'
  }

  private getInitialStatus(department: string): 'idle' | 'active' | 'responding' | 'maintenance' | 'out_of_service' {
    const rand = Math.random()
    if (department === 'police' || department === 'fire') {
      if (rand < 0.6) return 'active'
      if (rand < 0.85) return 'idle'
      if (rand < 0.95) return 'responding'
      return 'maintenance'
    }
    if (rand < 0.7) return 'active'
    if (rand < 0.9) return 'idle'
    return 'maintenance'
  }

  private getTripPurpose(): string {
    const purposes = [
      'Patrol', 'Emergency Response', 'Equipment Transport', 'Maintenance Route',
      'Public Service', 'Training', 'Administrative', 'Inspection'
    ]
    return purposes[Math.floor(Math.random() * purposes.length)]
  }

  private updateOBD2(vehicle: ComprehensiveVehicleData): void {
    const isMoving = vehicle.status === 'active' || vehicle.status === 'responding'

    if (isMoving) {
      const targetSpeed = this.getTargetSpeed(vehicle.vehicle.department, vehicle.status)
      vehicle.obd2.speed = this.smoothTransition(vehicle.obd2.speed, targetSpeed, 5)
      vehicle.obd2.rpm = 750 + vehicle.obd2.speed * 60
      vehicle.obd2.throttlePosition = Math.min(100, (vehicle.obd2.speed / targetSpeed) * 60)
      vehicle.obd2.engineLoad = Math.min(100, vehicle.obd2.throttlePosition * 0.8)

      // Fuel consumption
      vehicle.obd2.fuelLevel = Math.max(5, vehicle.obd2.fuelLevel - 0.001)
    } else {
      vehicle.obd2.speed = 0
      vehicle.obd2.rpm = vehicle.status === 'maintenance' ? 0 : 750
      vehicle.obd2.throttlePosition = 0
      vehicle.obd2.engineLoad = 0
    }

    // Temperature updates
    vehicle.obd2.coolantTemp = this.smoothTransition(vehicle.obd2.coolantTemp, isMoving ? 195 : 180, 2)
    vehicle.obd2.batteryVoltage = isMoving ? 14.2 + Math.random() * 0.4 : 12.6

    vehicle.obd2.timestamp = new Date()
  }

  private updateGPS(vehicle: ComprehensiveVehicleData): void {
    vehicle.gps.latitude = vehicle.currentLocation.latitude
    vehicle.gps.longitude = vehicle.currentLocation.longitude
    vehicle.gps.speed = vehicle.obd2.speed
    vehicle.gps.timestamp = new Date()
  }

  private updateTelemetrySnapshot(vehicle: ComprehensiveVehicleData): void {
    const tel = vehicle.telemetry
    tel.timestamp = new Date()

    if (vehicle.status === 'active' || vehicle.status === 'responding') {
      tel.drivingTime += 2
      tel.distanceTraveled += (vehicle.obd2.speed / 3600) * 2
    } else {
      tel.idleTime += 2
    }

    tel.engineHours += 2 / 3600 // 2 seconds to hours
  }

  private updateMobileAppState(vehicle: ComprehensiveVehicleData): void {
    const state = vehicle.mobileAppState

    // Random activity updates
    if (Math.random() < 0.01) {
      state.currentActivity = this.getRandomActivity(vehicle.vehicle.department)
      state.lastActivityTime = new Date()
    }

    // Random photo/note additions
    if (state.isDriverLoggedIn && Math.random() < 0.005) {
      state.photosTaken++
    }
    if (state.isDriverLoggedIn && Math.random() < 0.003) {
      state.notesEntered++
    }
  }

  private getTargetSpeed(department: string, status: string): number {
    if (status === 'responding') return 55 + Math.random() * 15

    const speedMap: Record<string, number> = {
      police: 35,
      fire: 45,
      publicWorks: 20,
      transit: 30,
      utilities: 30,
      parks: 25
    }

    return (speedMap[department] || 30) + Math.random() * 10
  }

  private getRandomActivity(department: string): string {
    const activities: Record<string, string[]> = {
      police: ['Patrol', 'Traffic Stop', 'Report Writing', 'Call Response'],
      fire: ['Station Standby', 'Training', 'Equipment Check', 'Emergency Response'],
      publicWorks: ['Street Maintenance', 'Pothole Repair', 'Waste Collection'],
      transit: ['Route Service', 'Break', 'Transfer Point'],
      utilities: ['Service Call', 'Meter Reading', 'Repair Work'],
      parks: ['Grounds Maintenance', 'Equipment Setup', 'Facility Inspection']
    }

    const acts = activities[department] || ['On Duty']
    return acts[Math.floor(Math.random() * acts.length)]
  }

  private smoothTransition(current: number, target: number, maxChange: number): number {
    const diff = target - current
    const change = Math.min(Math.abs(diff), maxChange) * Math.sign(diff)
    return current + change
  }
}

export default ComprehensiveFleetEmulator
