/**
 * RealisticOBD2Emulator - Production-grade OBD-II diagnostic data emulation
 *
 * Features:
 * - Physics-based sensor correlations (RPM-speed via transmission model)
 * - Realistic cold start behavior with warm-up curves
 * - Vehicle-specific parameters (engine size, fuel type, etc.)
 * - Environmental effects (ambient temperature, altitude)
 * - Sensor noise and measurement jitter
 * - Proper DTC generation based on sensor thresholds
 * - Fuel consumption modeling based on engine load
 * - Battery/alternator voltage based on engine state
 * - O2 sensor oscillation patterns
 */

import { EventEmitter } from 'events'
import { Vehicle, OBD2Data, EmulatorConfig } from '../types'

// Realistic gear ratios for common transmissions
const GEAR_RATIOS = {
  automatic: [3.82, 2.36, 1.53, 1.15, 0.85, 0.67], // 6-speed automatic
  cvt: [2.4, 2.0, 1.5, 1.0, 0.7], // Simulated CVT steps
  heavy: [4.7, 2.99, 2.0, 1.54, 1.19, 1.0, 0.78, 0.63] // Heavy equipment
}

const FINAL_DRIVE = 3.55 // Common final drive ratio
const TIRE_CIRCUMFERENCE = 2.21 // meters (for 265/70R17 tire)

interface EngineProfile {
  displacement: number // liters
  cylinders: number
  idleRpm: number
  maxRpm: number
  peakTorqueRpm: number
  peakPowerRpm: number
  fuelType: 'gasoline' | 'diesel' | 'electric'
  turbo: boolean
  operatingTemp: number // Celsius
  maxCoolantTemp: number
}

interface OBD2State {
  // Engine
  rpm: number
  targetRpm: number
  engineLoad: number
  throttlePosition: number

  // Temperatures
  coolantTemp: number
  intakeAirTemp: number
  oilTemp: number
  catalystTemp: number
  ambientTemp: number

  // Fuel System
  fuelLevel: number
  fuelPressure: number
  fuelRate: number
  shortTermFuelTrim: number
  longTermFuelTrim: number

  // Electrical
  batteryVoltage: number
  alternatorVoltage: number

  // Air System
  maf: number
  map: number
  barometricPressure: number

  // Oxygen Sensors
  o2Bank1: number
  o2Bank2: number
  o2Phase: number // For oscillation

  // Status
  engineRunning: boolean
  engineStartTime: Date | null
  distanceTraveled: number
  speed: number
  currentGear: number

  // Diagnostics
  dtcCodes: string[]
  checkEngineLight: boolean
  mil: boolean
  freezeFrameData: any | null
}

export class RealisticOBD2Emulator extends EventEmitter {
  private vehicle: Vehicle
  private config: EmulatorConfig
  private engineProfile: EngineProfile

  private state: OBD2State
  private isRunning: boolean = false
  private isPaused: boolean = false
  private updateInterval: NodeJS.Timeout | null = null

  // External inputs (from GPS emulator)
  private externalSpeed: number = 0
  private externalAcceleration: number = 0

  // Noise generators
  private noiseState: {
    rpm: number
    temp: number
    voltage: number
    o2: number
  }

  constructor(vehicle: Vehicle, config: EmulatorConfig) {
    super()
    this.vehicle = vehicle
    this.config = config

    // Determine engine profile based on vehicle type
    this.engineProfile = this.getEngineProfile()

    // Initialize noise state
    this.noiseState = { rpm: 0, temp: 0, voltage: 0, o2: 0 }

    // Initialize state
    this.state = this.getInitialState()
  }

  /**
   * Get engine profile based on vehicle type
   */
  private getEngineProfile(): EngineProfile {
    const make = this.vehicle.make.toLowerCase()
    const model = this.vehicle.model.toLowerCase()
    const type = this.vehicle.type

    // EV detection
    if (this.vehicle.batteryCapacity || make === 'tesla') {
      return {
        displacement: 0,
        cylinders: 0,
        idleRpm: 0,
        maxRpm: 0,
        peakTorqueRpm: 0,
        peakPowerRpm: 0,
        fuelType: 'electric',
        turbo: false,
        operatingTemp: 35,
        maxCoolantTemp: 60
      }
    }

    // Heavy equipment
    if (['excavator', 'dump_truck', 'loader'].includes(type)) {
      return {
        displacement: 8.8,
        cylinders: 6,
        idleRpm: 650,
        maxRpm: 2200,
        peakTorqueRpm: 1400,
        peakPowerRpm: 1800,
        fuelType: 'diesel',
        turbo: true,
        operatingTemp: 85,
        maxCoolantTemp: 105
      }
    }

    // Diesel trucks
    if (type === 'truck' && (model.includes('f-250') || model.includes('f-350') || make.includes('mack') || make.includes('peterbilt'))) {
      return {
        displacement: 6.7,
        cylinders: 8,
        idleRpm: 700,
        maxRpm: 3500,
        peakTorqueRpm: 1600,
        peakPowerRpm: 2400,
        fuelType: 'diesel',
        turbo: true,
        operatingTemp: 90,
        maxCoolantTemp: 110
      }
    }

    // Vans
    if (type === 'van') {
      return {
        displacement: 3.5,
        cylinders: 6,
        idleRpm: 750,
        maxRpm: 5500,
        peakTorqueRpm: 2500,
        peakPowerRpm: 4000,
        fuelType: 'gasoline',
        turbo: model.includes('sprinter'),
        operatingTemp: 90,
        maxCoolantTemp: 115
      }
    }

    // Gas trucks (F-150, Silverado, etc.)
    if (type === 'truck') {
      return {
        displacement: 5.0,
        cylinders: 8,
        idleRpm: 700,
        maxRpm: 5500,
        peakTorqueRpm: 3500,
        peakPowerRpm: 4500,
        fuelType: 'gasoline',
        turbo: false,
        operatingTemp: 90,
        maxCoolantTemp: 115
      }
    }

    // SUVs
    if (type === 'suv') {
      return {
        displacement: 3.5,
        cylinders: 6,
        idleRpm: 750,
        maxRpm: 6000,
        peakTorqueRpm: 3000,
        peakPowerRpm: 4500,
        fuelType: 'gasoline',
        turbo: false,
        operatingTemp: 90,
        maxCoolantTemp: 115
      }
    }

    // Default sedan/car
    return {
      displacement: 2.5,
      cylinders: 4,
      idleRpm: 800,
      maxRpm: 6500,
      peakTorqueRpm: 4000,
      peakPowerRpm: 5500,
      fuelType: 'gasoline',
      turbo: false,
      operatingTemp: 90,
      maxCoolantTemp: 115
    }
  }

  /**
   * Get initial state
   */
  private getInitialState(): OBD2State {
    // Randomize ambient temperature based on time of day (Florida weather)
    const hour = new Date().getHours()
    let ambientTemp = 25 // Base temperature
    if (hour >= 6 && hour < 10) ambientTemp = 22 + Math.random() * 5
    else if (hour >= 10 && hour < 16) ambientTemp = 28 + Math.random() * 8
    else if (hour >= 16 && hour < 20) ambientTemp = 25 + Math.random() * 5
    else ambientTemp = 20 + Math.random() * 5

    return {
      rpm: 0,
      targetRpm: 0,
      engineLoad: 0,
      throttlePosition: 0,

      coolantTemp: ambientTemp, // Start at ambient
      intakeAirTemp: ambientTemp,
      oilTemp: ambientTemp,
      catalystTemp: ambientTemp,
      ambientTemp: ambientTemp,

      fuelLevel: 50 + Math.random() * 40, // 50-90%
      fuelPressure: 0,
      fuelRate: 0,
      shortTermFuelTrim: 0,
      longTermFuelTrim: Math.random() * 6 - 3, // -3% to +3%

      batteryVoltage: 12.4 + Math.random() * 0.4,
      alternatorVoltage: 0,

      maf: 0,
      map: 101, // Atmospheric pressure at idle
      barometricPressure: 101.3,

      o2Bank1: 0.45,
      o2Bank2: 0.45,
      o2Phase: Math.random() * Math.PI * 2,

      engineRunning: false,
      engineStartTime: null,
      distanceTraveled: 0,
      speed: 0,
      currentGear: 0,

      dtcCodes: [],
      checkEngineLight: false,
      mil: false,
      freezeFrameData: null
    }
  }

  /**
   * Start OBD-II emulation
   */
  public async start(): Promise<void> {
    if (this.isRunning) return

    this.isRunning = true
    this.isPaused = false
    this.state.engineRunning = true
    this.state.engineStartTime = new Date()

    const updateFrequency = this.config.obd2?.updateFrequency || 1000

    this.updateInterval = setInterval(() => {
      if (!this.isPaused) {
        this.update()
      }
    }, updateFrequency)

    console.log(`RealisticOBD2Emulator started for vehicle ${this.vehicle.id}`)
  }

  /**
   * Stop OBD-II emulation
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) return

    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }

    this.state.engineRunning = false
    this.state.rpm = 0
    this.isRunning = false
    this.isPaused = false

    console.log(`RealisticOBD2Emulator stopped for vehicle ${this.vehicle.id}`)
  }

  public async pause(): Promise<void> {
    this.isPaused = true
  }

  public async resume(): Promise<void> {
    this.isPaused = false
  }

  /**
   * Update speed from GPS emulator
   */
  public updateSpeed(speed: number, acceleration: number = 0): void {
    this.externalSpeed = speed
    this.externalAcceleration = acceleration
  }

  /**
   * Update distance traveled
   */
  public updateDistance(distance: number): void {
    this.state.distanceTraveled = distance
    // Calculate fuel consumption based on distance and efficiency
    const fuelUsed = (distance / this.vehicle.fuelEfficiency) / this.vehicle.tankSize * 100
    this.state.fuelLevel = Math.max(0, this.state.fuelLevel - fuelUsed)
  }

  /**
   * Main update loop - physics-based calculations
   */
  private update(): void {
    if (!this.state.engineRunning && this.engineProfile.fuelType !== 'electric') {
      return
    }

    const deltaTime = (this.config.obd2?.updateFrequency || 1000) / 1000

    // Update noise state (Brownian motion for realism)
    this.updateNoise()

    // Calculate engine parameters based on speed
    this.updateEngineParameters(deltaTime)

    // Update temperatures (realistic warm-up and operating temps)
    this.updateTemperatures(deltaTime)

    // Update fuel system
    this.updateFuelSystem(deltaTime)

    // Update electrical system
    this.updateElectrical()

    // Update air flow sensors
    this.updateAirFlow()

    // Update oxygen sensors with realistic oscillation
    this.updateOxygenSensors(deltaTime)

    // Check for diagnostic issues
    this.checkDiagnostics()

    // Emit data
    this.emitData()
  }

  /**
   * Update noise state for sensor jitter
   */
  private updateNoise(): void {
    // Ornstein-Uhlenbeck process for mean-reverting noise
    const theta = 0.3 // Mean reversion speed
    const sigma = 0.5 // Noise intensity

    this.noiseState.rpm = this.noiseState.rpm * (1 - theta) + sigma * (Math.random() - 0.5)
    this.noiseState.temp = this.noiseState.temp * (1 - theta) + sigma * 0.3 * (Math.random() - 0.5)
    this.noiseState.voltage = this.noiseState.voltage * (1 - theta) + sigma * 0.1 * (Math.random() - 0.5)
    this.noiseState.o2 = this.noiseState.o2 * (1 - theta) + sigma * 0.05 * (Math.random() - 0.5)
  }

  /**
   * Calculate RPM based on speed using transmission model
   */
  private updateEngineParameters(deltaTime: number): void {
    const speed = this.externalSpeed
    this.state.speed = speed

    if (this.engineProfile.fuelType === 'electric') {
      // EVs don't have traditional RPM
      this.state.rpm = 0
      this.state.engineLoad = Math.min(100, (speed / 75) * 50 + Math.abs(this.externalAcceleration) * 20)
      this.state.throttlePosition = this.state.engineLoad * 0.8
      return
    }

    if (speed < 2) {
      // Idling
      this.state.targetRpm = this.engineProfile.idleRpm
      this.state.currentGear = 0
      this.state.engineLoad = 15 + this.noiseState.rpm * 2
      this.state.throttlePosition = 0
    } else {
      // Calculate gear based on speed
      const gearRatios = this.vehicle.type === 'excavator' || this.vehicle.type === 'dump_truck'
        ? GEAR_RATIOS.heavy
        : GEAR_RATIOS.automatic

      // Find appropriate gear
      let selectedGear = 1
      for (let g = gearRatios.length; g >= 1; g--) {
        const expectedRpm = this.calculateRpmForGear(speed, g, gearRatios)
        if (expectedRpm >= this.engineProfile.idleRpm * 1.2 && expectedRpm <= this.engineProfile.maxRpm * 0.85) {
          selectedGear = g
          break
        }
      }

      this.state.currentGear = selectedGear
      this.state.targetRpm = this.calculateRpmForGear(speed, selectedGear, gearRatios)

      // Calculate engine load based on speed, acceleration, and vehicle weight
      const baseLoad = (speed / 75) * 40
      const accelLoad = Math.abs(this.externalAcceleration) * 15
      const vehicleWeight = this.getVehicleWeight()
      const weightFactor = vehicleWeight / 5000 // Normalize to 5000 lbs

      this.state.engineLoad = Math.min(100, baseLoad + accelLoad * weightFactor + 15)
      this.state.throttlePosition = Math.min(100, this.state.engineLoad * 0.7 + Math.max(0, this.externalAcceleration) * 10)
    }

    // Smooth RPM transitions
    const rpmChangeRate = 1500 * deltaTime // RPM per second
    if (this.state.rpm < this.state.targetRpm) {
      this.state.rpm = Math.min(this.state.targetRpm, this.state.rpm + rpmChangeRate)
    } else {
      this.state.rpm = Math.max(this.state.targetRpm, this.state.rpm - rpmChangeRate)
    }

    // Add noise
    this.state.rpm += this.noiseState.rpm * 30
    this.state.rpm = Math.max(0, Math.min(this.engineProfile.maxRpm, this.state.rpm))
  }

  /**
   * Calculate RPM for a given gear
   */
  private calculateRpmForGear(speedMph: number, gear: number, gearRatios: number[]): number {
    if (gear < 1 || gear > gearRatios.length) return this.engineProfile.idleRpm

    const speedMs = speedMph * 0.44704 // mph to m/s
    const wheelRpm = (speedMs * 60) / TIRE_CIRCUMFERENCE
    const gearRatio = gearRatios[gear - 1]
    const engineRpm = wheelRpm * gearRatio * FINAL_DRIVE

    return Math.max(this.engineProfile.idleRpm, Math.min(this.engineProfile.maxRpm, engineRpm))
  }

  /**
   * Get vehicle weight in lbs
   */
  private getVehicleWeight(): number {
    const type = this.vehicle.type
    const weights: Record<string, number> = {
      sedan: 3500,
      suv: 4500,
      truck: 5500,
      van: 5000,
      excavator: 45000,
      dump_truck: 55000,
      trailer: 8000
    }
    return weights[type] || 4000
  }

  /**
   * Update temperatures with realistic warm-up curves
   */
  private updateTemperatures(deltaTime: number): void {
    const operatingTemp = this.engineProfile.operatingTemp

    if (!this.state.engineRunning) {
      // Cool down towards ambient
      const coolingRate = 0.5 // degrees per second
      this.state.coolantTemp = Math.max(this.state.ambientTemp,
        this.state.coolantTemp - coolingRate * deltaTime)
      this.state.oilTemp = Math.max(this.state.ambientTemp,
        this.state.oilTemp - coolingRate * 0.5 * deltaTime)
      return
    }

    // Engine warm-up curve
    const timeSinceStart = this.state.engineStartTime
      ? (Date.now() - this.state.engineStartTime.getTime()) / 1000
      : 0

    // Coolant warm-up: exponential approach to operating temp
    // Takes ~5-10 minutes to fully warm up
    const warmUpTimeConstant = 300 // seconds
    const tempDelta = operatingTemp - this.state.ambientTemp
    const targetCoolantTemp = this.state.ambientTemp + tempDelta * (1 - Math.exp(-timeSinceStart / warmUpTimeConstant))

    // Engine load affects warm-up speed
    const loadFactor = 1 + this.state.engineLoad / 100
    const warmUpRate = 0.3 * loadFactor * deltaTime

    if (this.state.coolantTemp < targetCoolantTemp) {
      this.state.coolantTemp += warmUpRate
    } else if (this.state.coolantTemp > operatingTemp + 5) {
      // Cooling if too hot
      this.state.coolantTemp -= warmUpRate * 0.5
    }

    // Add load-based heat
    this.state.coolantTemp += (this.state.engineLoad / 100) * 0.05

    // Add noise
    this.state.coolantTemp += this.noiseState.temp

    // Oil temp lags behind coolant
    const oilDelta = this.state.coolantTemp - this.state.oilTemp
    this.state.oilTemp += oilDelta * 0.1 * deltaTime

    // Intake air temp
    this.state.intakeAirTemp = this.state.ambientTemp +
      (this.state.engineLoad / 100) * 15 +
      (this.engineProfile.turbo ? 20 : 0)

    // Catalyst temp (much higher when running)
    if (this.state.speed > 10) {
      const targetCatTemp = 400 + (this.state.engineLoad / 100) * 400
      this.state.catalystTemp += (targetCatTemp - this.state.catalystTemp) * 0.02 * deltaTime
    } else {
      this.state.catalystTemp += (150 - this.state.catalystTemp) * 0.01 * deltaTime
    }
  }

  /**
   * Update fuel system parameters
   */
  private updateFuelSystem(deltaTime: number): void {
    if (this.engineProfile.fuelType === 'electric') {
      this.state.fuelPressure = 0
      this.state.fuelRate = 0
      return
    }

    // Fuel pressure based on engine type
    if (this.engineProfile.fuelType === 'diesel') {
      // Common rail diesel: very high pressure
      this.state.fuelPressure = 200 + (this.state.engineLoad / 100) * 1800 // 200-2000 bar
    } else {
      // Gasoline: lower pressure
      this.state.fuelPressure = 300 + (this.state.engineLoad / 100) * 100 // 300-400 kPa
    }

    // Fuel consumption rate based on engine load and RPM
    const baseFuelRate = this.engineProfile.displacement * 0.5 // L/h at idle
    const loadFactor = 1 + (this.state.engineLoad / 100) * 3
    const rpmFactor = this.state.rpm / this.engineProfile.idleRpm
    this.state.fuelRate = baseFuelRate * loadFactor * rpmFactor

    // Short-term fuel trim oscillation
    this.state.shortTermFuelTrim = Math.sin(Date.now() / 1000) * 3 + this.noiseState.o2 * 2

    // Update fuel level
    const fuelConsumed = (this.state.fuelRate / 3600) * deltaTime // Convert L/h to L/s
    const tankLiters = this.vehicle.tankSize * 3.785 // Convert gallons to liters
    this.state.fuelLevel -= (fuelConsumed / tankLiters) * 100
    this.state.fuelLevel = Math.max(0, this.state.fuelLevel)
  }

  /**
   * Update electrical system
   */
  private updateElectrical(): void {
    if (this.engineProfile.fuelType === 'electric') {
      // EV: higher voltage system
      this.state.batteryVoltage = 12.0 + this.noiseState.voltage
      this.state.alternatorVoltage = 0
      return
    }

    if (this.state.engineRunning && this.state.rpm > this.engineProfile.idleRpm * 0.8) {
      // Alternator charging
      const chargeVoltage = 13.8 + (this.state.rpm / 3000) * 0.5
      this.state.alternatorVoltage = Math.min(14.8, chargeVoltage) + this.noiseState.voltage * 0.2
      this.state.batteryVoltage = this.state.alternatorVoltage - 0.3 + this.noiseState.voltage * 0.1
    } else {
      // Engine off or starting
      this.state.alternatorVoltage = 0
      // Battery drains slowly
      this.state.batteryVoltage = Math.max(11.5, 12.4 - 0.001) + this.noiseState.voltage * 0.2
    }
  }

  /**
   * Update air flow sensors
   */
  private updateAirFlow(): void {
    if (this.engineProfile.fuelType === 'electric') {
      this.state.maf = 0
      this.state.map = 101
      return
    }

    // MAF: Mass Air Flow (g/s)
    // Calculated from engine displacement, RPM, and volumetric efficiency
    const displacement = this.engineProfile.displacement // liters
    const airDensity = 1.184 // kg/m3 at 25C
    const volumetricEfficiency = 0.85 + (this.engineProfile.turbo ? 0.15 : 0)

    const airVolume = (displacement / 1000) * (this.state.rpm / 2) / 60 * volumetricEfficiency
    this.state.maf = airVolume * airDensity * 1000 // g/s

    // Add load influence
    this.state.maf *= (0.3 + (this.state.engineLoad / 100) * 0.7)

    // MAP: Manifold Absolute Pressure
    // At idle (closed throttle): low MAP
    // At full throttle: approaches barometric pressure
    // Turbo: can exceed barometric
    const throttleFactor = this.state.throttlePosition / 100
    if (this.engineProfile.turbo && throttleFactor > 0.5) {
      // Boost pressure
      this.state.map = 101 + (throttleFactor - 0.5) * 100 // Up to 150 kPa
    } else {
      this.state.map = 30 + throttleFactor * 71 // 30-101 kPa
    }

    // Barometric pressure (varies slightly with altitude)
    this.state.barometricPressure = 101.3 + (Math.random() - 0.5) * 2
  }

  /**
   * Update oxygen sensors with realistic oscillation
   */
  private updateOxygenSensors(deltaTime: number): void {
    if (this.engineProfile.fuelType === 'electric') {
      this.state.o2Bank1 = 0
      this.state.o2Bank2 = 0
      return
    }

    // O2 sensors oscillate around stoichiometric (0.45V) when engine is warm
    // Frequency increases with engine speed
    const frequency = 0.5 + (this.state.rpm / 3000) * 2 // 0.5-2.5 Hz
    this.state.o2Phase += 2 * Math.PI * frequency * deltaTime

    if (this.state.coolantTemp > 60) {
      // Engine warm: normal oscillation
      const amplitude = 0.3 + this.noiseState.o2 * 0.1
      this.state.o2Bank1 = 0.45 + amplitude * Math.sin(this.state.o2Phase)
      this.state.o2Bank2 = 0.45 + amplitude * Math.sin(this.state.o2Phase + Math.PI / 4) // Slight offset
    } else {
      // Cold engine: reading stuck high (rich)
      this.state.o2Bank1 = 0.8 + this.noiseState.o2 * 0.1
      this.state.o2Bank2 = 0.8 + this.noiseState.o2 * 0.1
    }

    // Clamp values
    this.state.o2Bank1 = Math.max(0.1, Math.min(0.9, this.state.o2Bank1))
    this.state.o2Bank2 = Math.max(0.1, Math.min(0.9, this.state.o2Bank2))
  }

  /**
   * Check for diagnostic issues and generate DTCs
   */
  private checkDiagnostics(): void {
    const newDtcs: string[] = []

    // Overheating
    if (this.state.coolantTemp > this.engineProfile.maxCoolantTemp) {
      newDtcs.push('P0217') // Engine Overtemp
      this.state.checkEngineLight = true
    }

    // Low coolant temp (thermostat stuck open)
    if (this.state.engineRunning && this.getRunTime() > 600 && this.state.coolantTemp < 70) {
      newDtcs.push('P0128') // Coolant Temp Below Thermostat Regulating Temp
    }

    // Low battery voltage
    if (this.state.engineRunning && this.state.batteryVoltage < 12.0) {
      newDtcs.push('P0562') // System Voltage Low
      this.state.checkEngineLight = true
    }

    // High battery voltage (overcharging)
    if (this.state.alternatorVoltage > 15.0) {
      newDtcs.push('P0563') // System Voltage High
    }

    // MAF sensor issues (random rare occurrence)
    if (Math.random() < 0.00001) {
      newDtcs.push('P0101') // MAF Circuit Range/Performance
    }

    // O2 sensor issues
    if (this.state.coolantTemp > 80 && Math.abs(this.state.o2Bank1 - 0.45) > 0.4 && Math.random() < 0.0001) {
      newDtcs.push('P0130') // O2 Sensor Circuit (Bank 1)
    }

    // Catalyst efficiency (mileage-based)
    if (this.state.distanceTraveled > 80000 && Math.random() < 0.0001) {
      newDtcs.push('P0420') // Catalyst System Efficiency Below Threshold
      this.state.checkEngineLight = true
    }

    // Low fuel
    if (this.state.fuelLevel < 10) {
      this.emit('lowFuel', {
        vehicleId: this.vehicle.id,
        fuelLevel: this.state.fuelLevel,
        timestamp: new Date()
      })
    }

    // Critically low fuel
    if (this.state.fuelLevel < 5) {
      newDtcs.push('P0463') // Fuel Level Sensor Circuit High
    }

    // Random rare DTCs
    if (Math.random() < 0.00005) {
      const randomDtcs = ['P0300', 'P0171', 'P0172', 'P0442', 'P0455', 'P0500']
      const randomDtc = randomDtcs[Math.floor(Math.random() * randomDtcs.length)]
      if (!this.state.dtcCodes.includes(randomDtc)) {
        newDtcs.push(randomDtc)
        this.state.checkEngineLight = true
      }
    }

    // Add new DTCs
    for (const dtc of newDtcs) {
      if (!this.state.dtcCodes.includes(dtc)) {
        this.state.dtcCodes.push(dtc)
        this.emit('dtc', {
          vehicleId: this.vehicle.id,
          code: dtc,
          timestamp: new Date()
        })
      }
    }

    this.state.mil = this.state.dtcCodes.length > 0
  }

  /**
   * Get engine run time in seconds
   */
  private getRunTime(): number {
    if (!this.state.engineStartTime) return 0
    return (Date.now() - this.state.engineStartTime.getTime()) / 1000
  }

  /**
   * Clear DTCs
   */
  public clearDTCs(): void {
    this.state.dtcCodes = []
    this.state.checkEngineLight = false
    this.state.mil = false
    this.state.freezeFrameData = null
  }

  /**
   * Refuel vehicle
   */
  public refuel(percent: number = 100): void {
    this.state.fuelLevel = Math.min(100, percent)
  }

  /**
   * Emit OBD-II data
   */
  private emitData(): void {
    const data: OBD2Data = {
      vehicleId: this.vehicle.id,
      timestamp: new Date(),
      rpm: Math.round(this.state.rpm),
      speed: Math.round(this.state.speed),
      coolantTemp: Math.round(this.state.coolantTemp * 10) / 10,
      fuelLevel: Math.round(this.state.fuelLevel * 10) / 10,
      batteryVoltage: Math.round(this.state.batteryVoltage * 100) / 100,
      engineLoad: Math.round(this.state.engineLoad * 10) / 10,
      throttlePosition: Math.round(this.state.throttlePosition * 10) / 10,
      maf: Math.round(this.state.maf * 100) / 100,
      o2Sensor: Math.round(this.state.o2Bank1 * 1000) / 1000,
      dtcCodes: [...this.state.dtcCodes],
      checkEngineLight: this.state.checkEngineLight,
      mil: this.state.mil
    }

    this.emit('data', data)
  }

  /**
   * Get current state
   */
  public getCurrentState(): any {
    return {
      ...this.state,
      engineProfile: this.engineProfile
    }
  }
}
