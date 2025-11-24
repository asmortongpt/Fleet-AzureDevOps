/**
 * OBD2 Emulator Service
 *
 * Simulates realistic OBD2 vehicle data for testing and development.
 * Supports multiple vehicle profiles and real-time WebSocket streaming.
 *
 * Features:
 * - Realistic vehicle data simulation (RPM, speed, fuel, temp, etc.)
 * - Configurable vehicle profiles (sedan, truck, electric, diesel)
 * - DTC (Diagnostic Trouble Code) simulation
 * - WebSocket streaming to connected clients
 * - iOS app integration via REST API
 */

import { EventEmitter } from 'events'

// Vehicle profile types
export type VehicleProfile = 'sedan' | 'truck' | 'electric' | 'diesel' | 'sports'

// Emulated OBD2 data structure
export interface EmulatedOBD2Data {
  timestamp: Date
  sessionId: string
  vehicleId: number
  adapterId: number

  // Engine data
  engineRpm: number
  vehicleSpeed: number
  throttlePosition: number
  engineLoad: number

  // Temperature
  engineCoolantTemp: number
  intakeAirTemp: number
  catalystTemperature: number
  engineOilTemp: number

  // Fuel
  fuelLevel: number
  fuelPressure: number
  fuelConsumptionRate: number
  shortTermFuelTrim: number
  longTermFuelTrim: number

  // Airflow
  mafAirFlowRate: number
  intakeManifoldPressure: number

  // Electrical
  batteryVoltage: number
  controlModuleVoltage: number

  // Timing
  timingAdvance: number

  // Calculated values
  estimatedMpg: number
  distanceTraveled: number
  tripTime: number

  // Location (for fleet tracking)
  location?: {
    latitude: number
    longitude: number
    altitude: number
    speed: number
    heading: number
  }

  // Raw PIDs (for compatibility)
  allPids: Record<string, number | string>
}

// Emulated DTC
export interface EmulatedDTC {
  code: string
  type: 'powertrain' | 'chassis' | 'body' | 'network'
  description: string
  severity: 'critical' | 'major' | 'moderate' | 'minor' | 'informational'
  isMilOn: boolean
  freezeFrame?: Record<string, number>
}

// Vehicle profile configuration
interface VehicleProfileConfig {
  name: string
  maxRpm: number
  maxSpeed: number
  idleRpm: number
  fuelCapacity: number
  normalCoolantTemp: number
  engineType: 'gasoline' | 'diesel' | 'electric' | 'hybrid'
}

const VEHICLE_PROFILES: Record<VehicleProfile, VehicleProfileConfig> = {
  sedan: {
    name: 'Standard Sedan',
    maxRpm: 6500,
    maxSpeed: 130,
    idleRpm: 750,
    fuelCapacity: 15,
    normalCoolantTemp: 195,
    engineType: 'gasoline'
  },
  truck: {
    name: 'Work Truck',
    maxRpm: 5500,
    maxSpeed: 100,
    idleRpm: 650,
    fuelCapacity: 36,
    normalCoolantTemp: 200,
    engineType: 'diesel'
  },
  electric: {
    name: 'Electric Vehicle',
    maxRpm: 15000,
    maxSpeed: 150,
    idleRpm: 0,
    fuelCapacity: 100, // Battery percentage
    normalCoolantTemp: 85,
    engineType: 'electric'
  },
  diesel: {
    name: 'Diesel Engine',
    maxRpm: 4500,
    maxSpeed: 110,
    idleRpm: 700,
    fuelCapacity: 25,
    normalCoolantTemp: 190,
    engineType: 'diesel'
  },
  sports: {
    name: 'Sports Car',
    maxRpm: 8500,
    maxSpeed: 180,
    idleRpm: 900,
    fuelCapacity: 18,
    normalCoolantTemp: 210,
    engineType: 'gasoline'
  }
}

// Common DTCs for simulation
const SAMPLE_DTCS: EmulatedDTC[] = [
  {
    code: 'P0300',
    type: 'powertrain',
    description: 'Random/Multiple Cylinder Misfire Detected',
    severity: 'major',
    isMilOn: true
  },
  {
    code: 'P0171',
    type: 'powertrain',
    description: 'System Too Lean (Bank 1)',
    severity: 'moderate',
    isMilOn: true
  },
  {
    code: 'P0420',
    type: 'powertrain',
    description: 'Catalyst System Efficiency Below Threshold',
    severity: 'minor',
    isMilOn: true
  },
  {
    code: 'P0128',
    type: 'powertrain',
    description: 'Coolant Thermostat Below Operating Temperature',
    severity: 'minor',
    isMilOn: false
  },
  {
    code: 'P0442',
    type: 'powertrain',
    description: 'EVAP System Leak Detected (Small Leak)',
    severity: 'informational',
    isMilOn: false
  },
  {
    code: 'C0035',
    type: 'chassis',
    description: 'Left Front Wheel Speed Sensor Circuit',
    severity: 'major',
    isMilOn: true
  },
  {
    code: 'B0001',
    type: 'body',
    description: 'Driver Frontal Stage 1 Deployment Control',
    severity: 'critical',
    isMilOn: true
  },
  {
    code: 'U0100',
    type: 'network',
    description: 'Lost Communication With ECM/PCM',
    severity: 'critical',
    isMilOn: true
  }
]

export class OBD2EmulatorService extends EventEmitter {
  private static instance: OBD2EmulatorService

  // Active emulation sessions
  private sessions: Map<string, EmulationSession> = new Map()

  // Connected WebSocket clients
  private wsClients: Map<string, any> = new Map()

  private constructor() {
    super()
  }

  static getInstance(): OBD2EmulatorService {
    if (!OBD2EmulatorService.instance) {
      OBD2EmulatorService.instance = new OBD2EmulatorService()
    }
    return OBD2EmulatorService.instance
  }

  /**
   * Start a new emulation session
   */
  startSession(config: {
    sessionId: string
    vehicleId: number
    adapterId: number
    profile: VehicleProfile
    scenario?: 'idle' | 'city' | 'highway' | 'aggressive'
    generateDTCs?: boolean
    updateIntervalMs?: number
    location?: { latitude: number; longitude: number }
  }): EmulationSession {
    const session = new EmulationSession({
      ...config,
      emitter: this
    })

    this.sessions.set(config.sessionId, session)
    session.start()

    console.log(`[OBD2 Emulator] Started session ${config.sessionId} with profile ${config.profile}`)

    return session
  }

  /**
   * Stop an emulation session
   */
  stopSession(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.stop()
      this.sessions.delete(sessionId)
      console.log(`[OBD2 Emulator] Stopped session ${sessionId}`)
    }
  }

  /**
   * Get current data from a session
   */
  getSessionData(sessionId: string): EmulatedOBD2Data | null {
    const session = this.sessions.get(sessionId)
    return session?.getCurrentData() || null
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys())
  }

  /**
   * Register a WebSocket client
   */
  registerWSClient(clientId: string, ws: any): void {
    this.wsClients.set(clientId, ws)
    console.log(`[OBD2 Emulator] WebSocket client registered: ${clientId}`)
  }

  /**
   * Unregister a WebSocket client
   */
  unregisterWSClient(clientId: string): void {
    this.wsClients.delete(clientId)
    console.log(`[OBD2 Emulator] WebSocket client unregistered: ${clientId}`)
  }

  /**
   * Subscribe a client to a session
   */
  subscribeToSession(clientId: string, sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.addSubscriber(clientId)
      return true
    }
    return false
  }

  /**
   * Broadcast data to WebSocket clients
   */
  broadcastToSubscribers(sessionId: string, data: EmulatedOBD2Data): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const subscribers = session.getSubscribers()
    const message = JSON.stringify({
      type: 'obd2_data',
      sessionId,
      data
    })

    for (const clientId of subscribers) {
      const ws = this.wsClients.get(clientId)
      if (ws && ws.readyState === 1) { // WebSocket.OPEN
        ws.send(message)
      }
    }
  }

  /**
   * Get sample DTCs for testing
   */
  getSampleDTCs(count: number = 3): EmulatedDTC[] {
    const shuffled = [...SAMPLE_DTCS].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
  }

  /**
   * Generate a single data point (for REST API)
   */
  generateSingleDataPoint(profile: VehicleProfile = 'sedan'): EmulatedOBD2Data {
    const config = VEHICLE_PROFILES[profile]
    const session = new EmulationSession({
      sessionId: `single-${Date.now()}`,
      vehicleId: 1,
      adapterId: 1,
      profile,
      scenario: 'city',
      emitter: this
    })

    return session.generateDataPoint()
  }
}

/**
 * Individual emulation session
 */
class EmulationSession {
  private sessionId: string
  private vehicleId: number
  private adapterId: number
  private profile: VehicleProfileConfig
  private scenario: 'idle' | 'city' | 'highway' | 'aggressive'
  private generateDTCs: boolean
  private updateIntervalMs: number
  private emitter: OBD2EmulatorService

  private intervalId: NodeJS.Timeout | null = null
  private currentData: EmulatedOBD2Data | null = null
  private subscribers: Set<string> = new Set()

  // Simulation state
  private startTime: Date = new Date()
  private distanceTraveled: number = 0
  private fuelConsumed: number = 0
  private currentLocation: { latitude: number; longitude: number; heading: number }

  // State machines for realistic transitions
  private rpmTarget: number = 0
  private speedTarget: number = 0
  private throttleTarget: number = 0

  constructor(config: {
    sessionId: string
    vehicleId: number
    adapterId: number
    profile: VehicleProfile
    scenario?: 'idle' | 'city' | 'highway' | 'aggressive'
    generateDTCs?: boolean
    updateIntervalMs?: number
    location?: { latitude: number; longitude: number }
    emitter: OBD2EmulatorService
  }) {
    this.sessionId = config.sessionId
    this.vehicleId = config.vehicleId
    this.adapterId = config.adapterId
    this.profile = VEHICLE_PROFILES[config.profile]
    this.scenario = config.scenario || 'city'
    this.generateDTCs = config.generateDTCs ?? false
    this.updateIntervalMs = config.updateIntervalMs || 1000
    this.emitter = config.emitter

    // Initialize location (default to Tallahassee, FL)
    this.currentLocation = {
      latitude: config.location?.latitude || 30.4383,
      longitude: config.location?.longitude || -84.2807,
      heading: Math.random() * 360
    }

    this.initializeTargets()
  }

  private initializeTargets(): void {
    switch (this.scenario) {
      case 'idle':
        this.rpmTarget = this.profile.idleRpm
        this.speedTarget = 0
        this.throttleTarget = 0
        break
      case 'city':
        this.rpmTarget = this.profile.idleRpm + 1500
        this.speedTarget = 35
        this.throttleTarget = 25
        break
      case 'highway':
        this.rpmTarget = this.profile.idleRpm + 2500
        this.speedTarget = 70
        this.throttleTarget = 40
        break
      case 'aggressive':
        this.rpmTarget = this.profile.maxRpm * 0.8
        this.speedTarget = this.profile.maxSpeed * 0.75
        this.throttleTarget = 80
        break
    }
  }

  start(): void {
    this.startTime = new Date()
    this.intervalId = setInterval(() => {
      this.update()
    }, this.updateIntervalMs)

    // Initial data point
    this.update()
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  addSubscriber(clientId: string): void {
    this.subscribers.add(clientId)
  }

  removeSubscriber(clientId: string): void {
    this.subscribers.delete(clientId)
  }

  getSubscribers(): Set<string> {
    return this.subscribers
  }

  getCurrentData(): EmulatedOBD2Data | null {
    return this.currentData
  }

  generateDataPoint(): EmulatedOBD2Data {
    return this.calculateDataPoint()
  }

  private update(): void {
    this.currentData = this.calculateDataPoint()

    // Emit event
    this.emitter.emit('data', {
      sessionId: this.sessionId,
      data: this.currentData
    })

    // Broadcast to WebSocket subscribers
    this.emitter.broadcastToSubscribers(this.sessionId, this.currentData)
  }

  private calculateDataPoint(): EmulatedOBD2Data {
    const now = new Date()
    const elapsed = (now.getTime() - this.startTime.getTime()) / 1000

    // Add variation to targets based on scenario
    this.updateTargetsWithVariation()

    // Calculate current values with smooth transitions
    const rpm = this.smoothValue(this.currentData?.engineRpm || this.profile.idleRpm, this.rpmTarget, 200)
    const speed = this.smoothValue(this.currentData?.vehicleSpeed || 0, this.speedTarget, 5)
    const throttle = this.smoothValue(this.currentData?.throttlePosition || 0, this.throttleTarget, 10)

    // Calculate derived values
    const engineLoad = this.calculateEngineLoad(rpm, throttle)
    const coolantTemp = this.calculateCoolantTemp(elapsed)
    const fuelConsumption = this.calculateFuelConsumption(rpm, speed, throttle)

    // Update distance traveled
    this.distanceTraveled += speed / 3600 // Convert mph to miles per second
    this.fuelConsumed += fuelConsumption / 3600

    // Update location
    this.updateLocation(speed)

    const data: EmulatedOBD2Data = {
      timestamp: now,
      sessionId: this.sessionId,
      vehicleId: this.vehicleId,
      adapterId: this.adapterId,

      engineRpm: Math.round(rpm),
      vehicleSpeed: Math.round(speed),
      throttlePosition: Math.round(throttle),
      engineLoad: Math.round(engineLoad),

      engineCoolantTemp: Math.round(coolantTemp),
      intakeAirTemp: Math.round(this.addNoise(75, 5)),
      catalystTemperature: Math.round(this.addNoise(coolantTemp + 200, 20)),
      engineOilTemp: Math.round(this.addNoise(coolantTemp - 10, 5)),

      fuelLevel: Math.max(0, Math.round(100 - (this.fuelConsumed / this.profile.fuelCapacity) * 100)),
      fuelPressure: Math.round(this.addNoise(45, 3)),
      fuelConsumptionRate: Math.round(fuelConsumption * 100) / 100,
      shortTermFuelTrim: Math.round(this.addNoise(0, 5)),
      longTermFuelTrim: Math.round(this.addNoise(2, 3)),

      mafAirFlowRate: Math.round(this.calculateMAF(rpm, throttle) * 100) / 100,
      intakeManifoldPressure: Math.round(this.addNoise(30, 5)),

      batteryVoltage: Math.round(this.addNoise(14.2, 0.3) * 10) / 10,
      controlModuleVoltage: Math.round(this.addNoise(14.0, 0.2) * 10) / 10,

      timingAdvance: Math.round(this.addNoise(15, 3)),

      estimatedMpg: speed > 0 ? Math.round((speed / fuelConsumption) * 10) / 10 : 0,
      distanceTraveled: Math.round(this.distanceTraveled * 100) / 100,
      tripTime: Math.round(elapsed),

      location: {
        latitude: this.currentLocation.latitude,
        longitude: this.currentLocation.longitude,
        altitude: 50 + Math.random() * 10,
        speed: speed,
        heading: this.currentLocation.heading
      },

      allPids: {
        '010C': Math.round(rpm),
        '010D': Math.round(speed),
        '0111': Math.round(throttle),
        '0104': Math.round(engineLoad),
        '0105': Math.round(coolantTemp),
        '010F': Math.round(75),
        '012F': Math.round(100 - (this.fuelConsumed / this.profile.fuelCapacity) * 100),
        '0110': Math.round(this.calculateMAF(rpm, throttle) * 100) / 100,
        '0142': Math.round(14.2 * 10) / 10
      }
    }

    return data
  }

  private updateTargetsWithVariation(): void {
    const variationChance = Math.random()

    switch (this.scenario) {
      case 'idle':
        // Small idle variations
        this.rpmTarget = this.profile.idleRpm + this.addNoise(0, 50)
        break

      case 'city':
        // Stop-and-go traffic simulation
        if (variationChance < 0.1) {
          // Stop
          this.rpmTarget = this.profile.idleRpm
          this.speedTarget = 0
          this.throttleTarget = 0
        } else if (variationChance < 0.2) {
          // Accelerate
          this.rpmTarget = this.profile.idleRpm + 2500
          this.speedTarget = 40
          this.throttleTarget = 50
        } else {
          // Cruise
          this.rpmTarget = this.profile.idleRpm + 1500
          this.speedTarget = 30 + Math.random() * 15
          this.throttleTarget = 20 + Math.random() * 10
        }
        break

      case 'highway':
        // Steady cruise with occasional variations
        if (variationChance < 0.1) {
          this.speedTarget = 65 + Math.random() * 15
        }
        this.rpmTarget = this.profile.idleRpm + (this.speedTarget / 70) * 2500
        this.throttleTarget = 35 + Math.random() * 15
        break

      case 'aggressive':
        // Hard acceleration/deceleration
        if (variationChance < 0.15) {
          this.rpmTarget = this.profile.maxRpm * (0.7 + Math.random() * 0.3)
          this.speedTarget = this.profile.maxSpeed * (0.5 + Math.random() * 0.4)
          this.throttleTarget = 70 + Math.random() * 30
        } else if (variationChance < 0.25) {
          this.rpmTarget = this.profile.idleRpm + 1000
          this.speedTarget = 30
          this.throttleTarget = 10
        }
        break
    }
  }

  private smoothValue(current: number, target: number, maxChange: number): number {
    const diff = target - current
    const change = Math.min(Math.abs(diff), maxChange) * Math.sign(diff)
    return current + change
  }

  private addNoise(value: number, range: number): number {
    return value + (Math.random() - 0.5) * 2 * range
  }

  private calculateEngineLoad(rpm: number, throttle: number): number {
    const rpmFactor = rpm / this.profile.maxRpm
    const throttleFactor = throttle / 100
    return Math.min(100, (rpmFactor * 0.4 + throttleFactor * 0.6) * 100)
  }

  private calculateCoolantTemp(elapsedSeconds: number): number {
    // Warm up simulation - reaches normal temp in ~5 minutes
    const warmupFactor = Math.min(1, elapsedSeconds / 300)
    const baseTemp = 60 + warmupFactor * (this.profile.normalCoolantTemp - 60)
    return this.addNoise(baseTemp, 3)
  }

  private calculateFuelConsumption(rpm: number, speed: number, throttle: number): number {
    if (this.profile.engineType === 'electric') {
      // Electric consumption in kWh equivalent
      return (speed * 0.3 + throttle * 0.2) / 100
    }

    // Gallons per hour
    const baseConsumption = (rpm / 1000) * 0.1
    const loadFactor = throttle / 100
    return baseConsumption * (1 + loadFactor)
  }

  private calculateMAF(rpm: number, throttle: number): number {
    // Mass Air Flow in g/s
    const displacement = 2.0 // Assume 2.0L engine
    const volumetricEfficiency = 0.85
    const airDensity = 1.2 // kg/m3

    const airFlow = (rpm / 2) * (displacement / 1000) * volumetricEfficiency * airDensity
    return airFlow * (throttle / 100 + 0.2)
  }

  private updateLocation(speed: number): void {
    if (speed <= 0) return

    // Convert speed (mph) to lat/long change per second
    const speedMs = speed * 0.44704 // mph to m/s
    const earthRadius = 6371000 // meters

    // Random direction changes
    if (Math.random() < 0.1) {
      this.currentLocation.heading += (Math.random() - 0.5) * 30
      this.currentLocation.heading = this.currentLocation.heading % 360
    }

    const headingRad = this.currentLocation.heading * Math.PI / 180
    const distance = speedMs / this.updateIntervalMs * 1000

    const deltaLat = (distance * Math.cos(headingRad)) / earthRadius * (180 / Math.PI)
    const deltaLon = (distance * Math.sin(headingRad)) / (earthRadius * Math.cos(this.currentLocation.latitude * Math.PI / 180)) * (180 / Math.PI)

    this.currentLocation.latitude += deltaLat
    this.currentLocation.longitude += deltaLon
  }
}

export default OBD2EmulatorService.getInstance()
