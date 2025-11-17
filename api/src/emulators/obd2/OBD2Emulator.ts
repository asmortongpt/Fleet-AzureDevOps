/**
 * OBD2Emulator - Realistic OBD-II diagnostic data emulation
 * Features:
 * - Engine RPM correlated with speed
 * - Coolant temperature (cold start to operating temp)
 * - Fuel level decreasing with distance
 * - Battery voltage variations
 * - Diagnostic Trouble Codes (DTCs)
 * - Check Engine Light simulation
 */

import { EventEmitter } from 'events'
import { Vehicle, OBD2Data, EmulatorConfig } from '../types'

export class OBD2Emulator extends EventEmitter {
  private vehicle: Vehicle
  private config: EmulatorConfig

  private isRunning: boolean = false
  private isPaused: boolean = false
  private updateInterval: NodeJS.Timeout | null = null

  // OBD-II State
  private rpm: number = 0
  private speed: number = 0
  private coolantTemp: number = 20 // Start at ambient temp
  private fuelLevel: number = 75 // Start at 75%
  private batteryVoltage: number = 12.6
  private engineLoad: number = 0
  private throttlePosition: number = 0
  private maf: number = 0 // Mass Air Flow
  private o2Sensor: number = 0.45 // Lambda sensor
  private dtcCodes: string[] = []
  private checkEngineLight: boolean = false
  private mil: boolean = false // Malfunction Indicator Lamp

  // Engine state
  private engineTemp: number = 20
  private isEngineWarmed: boolean = false
  private distanceTraveled: number = 0
  private lastFuelStop: number = 0

  constructor(vehicle: Vehicle, config: EmulatorConfig) {
    super()
    this.vehicle = vehicle
    this.config = config
  }

  /**
   * Start OBD-II emulation
   */
  public async start(): Promise<void> {
    if (this.isRunning) return

    this.isRunning = true
    this.isPaused = false

    const updateFrequency = this.config.obd2?.updateFrequency || 2000

    this.updateInterval = setInterval(() => {
      if (!this.isPaused) {
        this.update()
      }
    }, updateFrequency)

    console.log(`OBD-II Emulator started for vehicle ${this.vehicle.id}`)
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

    this.isRunning = false
    this.isPaused = false

    console.log(`OBD-II Emulator stopped for vehicle ${this.vehicle.id}`)
  }

  /**
   * Pause OBD-II emulation
   */
  public async pause(): Promise<void> {
    this.isPaused = true
  }

  /**
   * Resume OBD-II emulation
   */
  public async resume(): Promise<void> {
    this.isPaused = false
  }

  /**
   * Update speed from GPS emulator
   */
  public updateSpeed(speed: number): void {
    this.speed = speed
  }

  /**
   * Update distance traveled
   */
  public updateDistance(distance: number): void {
    this.distanceTraveled = distance

    // Decrease fuel level based on distance
    const fuelConsumption = distance / this.vehicle.fuelEfficiency
    this.fuelLevel = Math.max(0, this.fuelLevel - (fuelConsumption / this.vehicle.tankSize) * 100)
  }

  /**
   * Main update loop
   */
  private update(): void {
    // Update RPM based on speed
    this.updateRPM()

    // Update coolant temperature (gradual warm-up)
    this.updateCoolantTemp()

    // Update battery voltage
    this.updateBatteryVoltage()

    // Update engine load and throttle
    this.updateEngineLoad()

    // Update Mass Air Flow
    this.updateMAF()

    // Update O2 sensor
    this.updateO2Sensor()

    // Check for diagnostic issues
    this.checkDiagnostics()

    // Emit OBD-II data
    this.emitData()
  }

  /**
   * Update RPM based on speed
   */
  private updateRPM(): void {
    if (this.speed === 0) {
      // Idling
      const idleRpm = this.config.obd2?.parameters?.rpm?.idle || 800
      this.rpm = idleRpm + (Math.random() * 100 - 50) // Slight variation
    } else {
      // RPM increases with speed
      // Assuming automatic transmission with typical gear ratios
      const baseRPM = 800
      const rpmPerMph = 40 // Rough approximation

      this.rpm = baseRPM + (this.speed * rpmPerMph)

      // Add some variation
      this.rpm += (Math.random() * 200 - 100)

      // Clamp to limits
      const maxRpm = this.config.obd2?.parameters?.rpm?.max || 6500
      this.rpm = Math.min(this.rpm, maxRpm)
    }
  }

  /**
   * Update coolant temperature
   */
  private updateCoolantTemp(): void {
    const operatingTemp = this.config.obd2?.parameters?.coolantTemp?.operating || 90

    if (!this.isEngineWarmed && this.coolantTemp < operatingTemp) {
      // Warm up phase - gradual increase
      const warmUpRate = 0.5 // degrees per update
      this.coolantTemp = Math.min(operatingTemp, this.coolantTemp + warmUpRate)

      if (this.coolantTemp >= operatingTemp - 5) {
        this.isEngineWarmed = true
      }
    } else {
      // Maintain operating temperature with small variations
      this.coolantTemp = operatingTemp + (Math.random() * 10 - 5)
    }

    // Check for overheating (rare random event)
    if (Math.random() < 0.0001) {
      this.coolantTemp = 115 // Overheat
      this.addDTC('P0217') // Engine Coolant Over Temperature
    }
  }

  /**
   * Update battery voltage
   */
  private updateBatteryVoltage(): void {
    const normalVoltage = this.config.obd2?.parameters?.batteryVoltage?.normal || 12.6

    if (this.speed === 0) {
      // Idling - voltage drops slightly
      this.batteryVoltage = normalVoltage - 0.3 + (Math.random() * 0.2 - 0.1)
    } else {
      // Charging while driving
      this.batteryVoltage = normalVoltage + 1.0 + (Math.random() * 0.4 - 0.2)
    }

    // Clamp to limits
    const minVoltage = this.config.obd2?.parameters?.batteryVoltage?.min || 11.5
    const maxVoltage = this.config.obd2?.parameters?.batteryVoltage?.max || 14.5
    this.batteryVoltage = Math.max(minVoltage, Math.min(maxVoltage, this.batteryVoltage))

    // Check for low battery
    if (this.batteryVoltage < 12.0) {
      this.addDTC('P0562') // System Voltage Low
    }
  }

  /**
   * Update engine load
   */
  private updateEngineLoad(): void {
    if (this.speed === 0) {
      this.engineLoad = 15 + (Math.random() * 10) // Low load at idle
      this.throttlePosition = 0
    } else {
      // Load increases with speed and acceleration
      this.engineLoad = Math.min(100, (this.speed / 75) * 60 + (Math.random() * 20))
      this.throttlePosition = Math.min(100, (this.speed / 75) * 50 + (Math.random() * 20))
    }
  }

  /**
   * Update Mass Air Flow sensor
   */
  private updateMAF(): void {
    // MAF correlates with RPM and load
    // Typical range: 2-300 g/s
    this.maf = (this.rpm / 1000) * (this.engineLoad / 100) * 15 + (Math.random() * 5)
    this.maf = Math.max(2, Math.min(300, this.maf))
  }

  /**
   * Update O2 sensor (lambda)
   */
  private updateO2Sensor(): void {
    // O2 sensor reading (lambda)
    // 0.45V = rich, 0.45V = stoichiometric, >0.45V = lean
    // Normal operation oscillates around 0.45V
    this.o2Sensor = 0.45 + (Math.random() * 0.4 - 0.2)
    this.o2Sensor = Math.max(0.1, Math.min(0.9, this.o2Sensor))
  }

  /**
   * Check for diagnostic issues
   */
  private checkDiagnostics(): void {
    // Random DTC generation (very low probability)
    const dtcProbability = this.config.obd2?.diagnostics?.dtcProbability || 0.001

    if (Math.random() < dtcProbability) {
      this.generateRandomDTC()
    }

    // Check engine light based on DTCs
    if (this.dtcCodes.length > 0) {
      this.checkEngineLight = true
      this.mil = true
    }

    // Specific condition checks
    if (this.coolantTemp > 110) {
      this.checkEngineLight = true
      this.mil = true
    }

    if (this.fuelLevel < 10) {
      // Low fuel warning (not a DTC but important)
      this.emit('lowFuel', {
        vehicleId: this.vehicle.id,
        fuelLevel: this.fuelLevel,
        timestamp: new Date()
      })
    }
  }

  /**
   * Generate random DTC
   */
  private generateRandomDTC(): void {
    const commonDTCs = [
      'P0300', // Random/Multiple Cylinder Misfire
      'P0171', // System Too Lean (Bank 1)
      'P0172', // System Too Rich (Bank 1)
      'P0420', // Catalyst System Efficiency Below Threshold
      'P0442', // Evaporative Emission System Leak Detected (Small Leak)
      'P0455', // Evaporative Emission System Leak Detected (Large Leak)
      'P0128', // Coolant Thermostat (Coolant Temp Below Thermostat Regulating Temp)
      'P0500', // Vehicle Speed Sensor Malfunction
      'P0562', // System Voltage Low
      'P0601', // Internal Control Module Memory Check Sum Error
    ]

    const randomDTC = commonDTCs[Math.floor(Math.random() * commonDTCs.length)]
    this.addDTC(randomDTC)
  }

  /**
   * Add DTC
   */
  private addDTC(code: string): void {
    if (!this.dtcCodes.includes(code)) {
      this.dtcCodes.push(code)
      this.emit('dtc', {
        vehicleId: this.vehicle.id,
        code,
        timestamp: new Date()
      })
    }
  }

  /**
   * Clear DTCs (maintenance action)
   */
  public clearDTCs(): void {
    this.dtcCodes = []
    this.checkEngineLight = false
    this.mil = false
  }

  /**
   * Refuel vehicle
   */
  public refuel(percent: number = 100): void {
    this.fuelLevel = Math.min(100, percent)
    this.lastFuelStop = this.distanceTraveled
  }

  /**
   * Emit OBD-II data
   */
  private emitData(): void {
    const data: OBD2Data = {
      vehicleId: this.vehicle.id,
      timestamp: new Date(),
      rpm: Math.round(this.rpm),
      speed: Math.round(this.speed),
      coolantTemp: Math.round(this.coolantTemp),
      fuelLevel: Math.round(this.fuelLevel),
      batteryVoltage: Number(this.batteryVoltage.toFixed(1)),
      engineLoad: Math.round(this.engineLoad),
      throttlePosition: Math.round(this.throttlePosition),
      maf: Number(this.maf.toFixed(1)),
      o2Sensor: Number(this.o2Sensor.toFixed(2)),
      dtcCodes: [...this.dtcCodes],
      checkEngineLight: this.checkEngineLight,
      mil: this.mil
    }

    this.emit('data', data)
  }

  /**
   * Get current state
   */
  public getCurrentState(): any {
    return {
      rpm: this.rpm,
      speed: this.speed,
      coolantTemp: this.coolantTemp,
      fuelLevel: this.fuelLevel,
      batteryVoltage: this.batteryVoltage,
      engineLoad: this.engineLoad,
      dtcCodes: this.dtcCodes,
      checkEngineLight: this.checkEngineLight
    }
  }
}
