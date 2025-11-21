/**
 * Core type definitions for the Fleet Emulator System
 */

export interface Location {
  lat: number
  lng: number
  altitude?: number
  accuracy?: number
}

export interface Waypoint extends Location {
  name: string
  type: 'depot' | 'delivery' | 'service' | 'break' | 'pickup' | 'emergency' | 'waypoint'
  stopDuration: number
}

export interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  type: 'sedan' | 'suv' | 'truck' | 'van' | 'ev'
  vin: string
  licensePlate: string
  tankSize: number
  fuelEfficiency: number
  batteryCapacity?: number
  electricRange?: number
  startingLocation: Location
  homeBase: Location & { name: string }
  driverBehavior: 'aggressive' | 'normal' | 'cautious'
  features: string[]
}

export interface Route {
  id: string
  name: string
  description: string
  type: 'delivery' | 'longhaul' | 'service' | 'shuttle' | 'emergency'
  estimatedDuration: number
  estimatedDistance: number
  waypoints: Waypoint[]
  roadTypes: ('city' | 'highway' | 'residential')[]
  trafficPatterns: Record<string, string>
  priority?: string
  frequency?: string
}

export interface Geofence {
  id: string
  name: string
  type: 'operational' | 'restricted'
  center: Location
  radius: number
  alertOnEntry: boolean
  alertOnExit: boolean
}

export interface Scenario {
  name: string
  description: string
  duration: number
  activeVehicles: number
  trafficLevel: string
  weatherConditions: string
  timeOfDay: string
  events: {
    fuelPurchases: { frequency: string; count: number }
    maintenanceEvents: { frequency: string; count: number }
    anomalies: { frequency: string; count: number }
  }
  modifiers?: Record<string, any>
}

export interface EmulatorConfig {
  emulator: {
    version: string
    name: string
    description: string
  }
  timeCompression: {
    enabled: boolean
    ratio: number
    description: string
  }
  persistence: {
    enabled: boolean
    database: string
    redis: {
      enabled: boolean
      ttl: number
    }
  }
  realtime: {
    websocket: {
      enabled: boolean
      port: number
      path: string
    }
    broadcasting: {
      interval: number
      batchSize: number
    }
  }
  performance: {
    maxVehicles: number
    maxConcurrentEmulators: number
    updateInterval: number
    memoryLimit: string
  }
  [key: string]: any
}

export interface GPSTelemetry {
  vehicleId: string
  timestamp: Date
  location: Location
  speed: number
  heading: number
  odometer: number
  accuracy: number
  satelliteCount?: number
}

export interface OBD2Data {
  vehicleId: string
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
  dtcCodes: string[]
  checkEngineLight: boolean
  mil: boolean
}

export interface FuelTransaction {
  vehicleId: string
  timestamp: Date
  stationId: string
  stationName: string
  location: Location
  gallons: number
  pricePerGallon: number
  totalCost: number
  fuelType: string
  paymentMethod: string
  odometer: number
  receiptNumber: string
}

export interface MaintenanceEvent {
  vehicleId: string
  timestamp: Date
  type: 'scheduled' | 'unscheduled'
  category: string
  description: string
  parts: Array<{
    name: string
    partNumber: string
    quantity: number
    cost: number
  }>
  laborHours: number
  laborCost: number
  totalCost: number
  vendorId: string
  vendorName: string
  warranty: boolean
  nextDueOdometer?: number
}

export interface DriverBehaviorEvent {
  vehicleId: string
  timestamp: Date
  eventType: 'speeding' | 'hardBraking' | 'hardAcceleration' | 'idling' | 'seatbeltViolation' | 'distraction'
  severity: 'low' | 'medium' | 'high'
  location: Location
  speed: number
  speedLimit?: number
  duration?: number
  score: number
}

export interface IoTSensorData {
  vehicleId: string
  timestamp: Date
  sensors: {
    engineTemp?: number
    cargoTemp?: number
    cabinTemp?: number
    tirePressure?: {
      frontLeft: number
      frontRight: number
      rearLeft: number
      rearRight: number
    }
    cargoWeight?: number
    doorStatus?: {
      driver: boolean
      passenger: boolean
      cargo: boolean
    }
    ignitionStatus?: boolean
    accelerometer?: { x: number; y: number; z: number }
    gyroscope?: { x: number; y: number; z: number }
    connectivity?: {
      type: string
      signalStrength: number
      connected: boolean
    }
  }
}

export interface CostRecord {
  vehicleId: string
  timestamp: Date
  category: 'fuel' | 'maintenance' | 'insurance' | 'registration' | 'toll' | 'parking' | 'depreciation' | 'wage'
  amount: number
  description: string
  invoiceNumber?: string
  vendorId?: string
  vendorName?: string
}

export interface EmulatorState {
  id: string
  vehicleId: string
  emulatorType: string
  status: 'idle' | 'running' | 'paused' | 'error'
  startedAt?: Date
  pausedAt?: Date
  stoppedAt?: Date
  currentRoute?: string
  currentScenario?: string
  metrics: {
    eventsGenerated: number
    dataPointsGenerated: number
    errorsEncountered: number
    uptime: number
  }
}

export interface EmulatorEvent {
  type: string
  vehicleId: string
  timestamp: Date
  data: any
  metadata?: Record<string, any>
}

export type EmulatorStatus = 'idle' | 'running' | 'paused' | 'error'

export interface EmulatorStats {
  totalVehicles: number
  activeVehicles: number
  totalEvents: number
  eventsPerSecond: number
  uptime: number
  memoryUsage: number
}

// EV Charging Types
export interface EVChargingSession {
  id: string
  vehicleId: string
  stationId: string
  startTime: Date
  endTime?: Date
  startCharge: number // %
  endCharge?: number // %
  currentCharge?: number // %
  targetCharge?: number // % Target charge level
  energyDelivered: number // kWh
  cost: number
  status: 'active' | 'completed' | 'interrupted' | 'charging'
  powerLevel: 'level1' | 'level2' | 'dcfast'
  maxPower: number // kW
  powerKw?: number // kW (alternative property name)
  duration?: number // minutes
}

export interface ChargingStation {
  id: string
  name: string
  location: Location
  type: 'level1' | 'level2' | 'dcfast'
  maxPower: number // kW
  powerKw?: number // kW (alternative property name)
  status: 'available' | 'in-use' | 'offline'
  connectorType: string
  pricePerKwh: number
  networkId?: string
  inUse?: boolean
}

export interface BatteryHealth {
  vehicleId: string
  health: number // %
  capacity: number // kWh
  degradationRate: number // % per year
  cycleCount: number
  lastUpdated: Date
  estimatedRange: number // miles
}
