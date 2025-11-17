/**
 * CostEmulator - Comprehensive cost tracking
 */

import { EventEmitter } from 'events'
import { Vehicle, CostRecord, EmulatorConfig } from '../types'

export class CostEmulator extends EventEmitter {
  private vehicle: Vehicle
  private config: EmulatorConfig
  private isRunning: boolean = false
  private isPaused: boolean = false

  constructor(vehicle: Vehicle, config: EmulatorConfig) {
    super()
    this.vehicle = vehicle
    this.config = config
  }

  public async start(): Promise<void> {
    if (this.isRunning) return
    this.isRunning = true
    this.isPaused = false
    console.log(`Cost Emulator started for vehicle ${this.vehicle.id}`)
  }

  public async stop(): Promise<void> {
    this.isRunning = false
  }

  public async pause(): Promise<void> { this.isPaused = true }
  public async resume(): Promise<void> { this.isPaused = false }

  public recordCost(category: string, amount: number, description: string): void {
    const record: CostRecord = {
      vehicleId: this.vehicle.id,
      timestamp: new Date(),
      category: category as any,
      amount,
      description,
      invoiceNumber: `INV-${Date.now()}`
    }

    this.emit('data', record)
  }

  public getCurrentState(): any {
    return { vehicleId: this.vehicle.id }
  }
}
