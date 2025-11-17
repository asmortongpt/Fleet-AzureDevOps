/**
 * IoTEmulator - IoT sensor data emulation
 */

import { EventEmitter } from 'events'
import { Vehicle, IoTSensorData, EmulatorConfig } from '../types'

export class IoTEmulator extends EventEmitter {
  private vehicle: Vehicle
  private config: EmulatorConfig
  private isRunning: boolean = false
  private isPaused: boolean = false
  private updateInterval: NodeJS.Timeout | null = null

  constructor(vehicle: Vehicle, config: EmulatorConfig) {
    super()
    this.vehicle = vehicle
    this.config = config
  }

  public async start(): Promise<void> {
    if (this.isRunning) return
    this.isRunning = true
    this.isPaused = false

    this.updateInterval = setInterval(() => {
      if (!this.isPaused) {
        this.update()
      }
    }, 10000) // Update every 10 seconds

    console.log(`IoT Emulator started for vehicle ${this.vehicle.id}`)
  }

  public async stop(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
    this.isRunning = false
  }

  public async pause(): Promise<void> { this.isPaused = true }
  public async resume(): Promise<void> { this.isPaused = false }

  private update(): void {
    const data: IoTSensorData = {
      vehicleId: this.vehicle.id,
      timestamp: new Date(),
      sensors: {
        engineTemp: Math.random() * 40 + 80, // 80-120°F
        cabinTemp: Math.random() * 30 + 60, // 60-90°F
        tirePressure: {
          frontLeft: Math.random() * 7 + 28,
          frontRight: Math.random() * 7 + 28,
          rearLeft: Math.random() * 7 + 28,
          rearRight: Math.random() * 7 + 28
        },
        doorStatus: {
          driver: Math.random() > 0.9,
          passenger: Math.random() > 0.95,
          cargo: Math.random() > 0.98
        },
        ignitionStatus: true,
        accelerometer: {
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2,
          z: 9.8 + (Math.random() - 0.5)
        },
        gyroscope: {
          x: (Math.random() - 0.5) * 0.5,
          y: (Math.random() - 0.5) * 0.5,
          z: (Math.random() - 0.5) * 0.5
        },
        connectivity: {
          type: '4G',
          signalStrength: Math.random() * 70 - 120,
          connected: true
        }
      }
    }

    this.emit('data', data)
  }

  public getCurrentState(): any {
    return { vehicleId: this.vehicle.id }
  }
}
