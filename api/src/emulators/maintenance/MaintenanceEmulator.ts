/**
 * MaintenanceEmulator - Scheduled and unscheduled maintenance events
 */

import { EventEmitter } from 'events'
import { Vehicle, MaintenanceEvent, EmulatorConfig } from '../types'

export class MaintenanceEmulator extends EventEmitter {
  private vehicle: Vehicle
  private config: EmulatorConfig
  private isRunning: boolean = false
  private isPaused: boolean = false
  private updateInterval: NodeJS.Timeout | null = null

  private odometer: number = 0
  private lastOilChange: number = 0
  private lastTireRotation: number = 0
  private lastInspection: number = 0
  private lastBrakes: number = 0

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
        this.checkMaintenance()
      }
    }, 300000) // Check every 5 minutes

    console.log(`Maintenance Emulator started for vehicle ${this.vehicle.id}`)
  }

  public async stop(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
    this.isRunning = false
    console.log(`Maintenance Emulator stopped for vehicle ${this.vehicle.id}`)
  }

  public async pause(): Promise<void> { this.isPaused = true }
  public async resume(): Promise<void> { this.isPaused = false }

  public updateOdometer(miles: number): void {
    this.odometer = miles
  }

  private checkMaintenance(): void {
    const scheduled = this.config.maintenance?.scheduled

    // Check oil change
    if (scheduled?.oilChange && this.odometer - this.lastOilChange >= scheduled.oilChange.interval) {
      this.generateMaintenanceEvent('oilChange', 'Oil Change', scheduled.oilChange.cost)
      this.lastOilChange = this.odometer
    }

    // Check tire rotation
    if (scheduled?.tireRotation && this.odometer - this.lastTireRotation >= scheduled.tireRotation.interval) {
      this.generateMaintenanceEvent('tireRotation', 'Tire Rotation', scheduled.tireRotation.cost)
      this.lastTireRotation = this.odometer
    }

    // Check inspection
    if (scheduled?.inspection && this.odometer - this.lastInspection >= scheduled.inspection.interval) {
      this.generateMaintenanceEvent('inspection', 'Vehicle Inspection', scheduled.inspection.cost)
      this.lastInspection = this.odometer
    }

    // Check brakes
    if (scheduled?.brakes && this.odometer - this.lastBrakes >= scheduled.brakes.interval) {
      this.generateMaintenanceEvent('brakes', 'Brake Service', scheduled.brakes.cost)
      this.lastBrakes = this.odometer
    }

    // Random unscheduled maintenance
    const unscheduledProb = this.config.maintenance?.unscheduled?.probability || 0.0001
    if (Math.random() < unscheduledProb) {
      this.generateUnscheduledMaintenance()
    }
  }

  private generateMaintenanceEvent(category: string, description: string, costRange: any): void {
    const laborHours = Math.random() * 3 + 1
    // NOTE: Hardcoded for emulator/demo mode only - $95/hour
    // PRODUCTION: Should query vendor pricing database or configuration table
    const laborRate = 95
    const partsCost = Math.random() * (costRange.max - costRange.min) + costRange.min

    const event: MaintenanceEvent = {
      vehicleId: this.vehicle.id,
      timestamp: new Date(),
      type: 'scheduled',
      category,
      description,
      parts: this.generateParts(category, partsCost),
      laborHours: Number(laborHours.toFixed(1)),
      laborCost: Number((laborHours * laborRate).toFixed(2)),
      totalCost: Number((laborHours * laborRate + partsCost).toFixed(2)),
      vendorId: `VENDOR-${Math.floor(Math.random() * 100)}`,
      vendorName: this.getRandomVendor(),
      warranty: Math.random() > 0.7,
      nextDueOdometer: this.odometer + this.getNextInterval(category)
    }

    this.emit('data', event)
  }

  private generateUnscheduledMaintenance(): void {
    const issues = [
      'Battery Replacement',
      'Alternator Repair',
      'Starter Motor Replacement',
      'Transmission Service',
      'Suspension Repair',
      'Exhaust System Repair',
      'Radiator Replacement'
    ]

    const description = issues[Math.floor(Math.random() * issues.length)]
    const costRange = this.config.maintenance?.unscheduled?.cost || { min: 100, max: 2000 }

    this.generateMaintenanceEvent('unscheduled', description, costRange)
  }

  private generateParts(category: string, totalCost: number): any[] {
    const parts = []
    const partCount = Math.floor(Math.random() * 3) + 1

    for (let i = 0; i < partCount; i++) {
      parts.push({
        name: `${category} Part ${i + 1}`,
        partNumber: `PN-${Math.floor(Math.random() * 100000)}`,
        quantity: 1,
        cost: Number((totalCost / partCount).toFixed(2))
      })
    }

    return parts
  }

  private getNextInterval(category: string): number {
    const intervals: Record<string, number> = {
      oilChange: 5000,
      tireRotation: 7500,
      inspection: 10000,
      brakes: 30000
    }
    return intervals[category] || 10000
  }

  private getRandomVendor(): string {
    // NOTE: Hardcoded for emulator/demo mode only
    // PRODUCTION: Should query vendors table from database
    // SELECT name FROM vendors WHERE type = 'maintenance' ORDER BY RANDOM() LIMIT 1
    const vendors = ['Jiffy Lube', 'Midas', 'Firestone', 'Pep Boys', 'AutoZone Service']
    return vendors[Math.floor(Math.random() * vendors.length)]
  }

  public getCurrentState(): any {
    return {
      odometer: this.odometer,
      lastOilChange: this.lastOilChange,
      lastTireRotation: this.lastTireRotation,
      lastInspection: this.lastInspection,
      lastBrakes: this.lastBrakes
    }
  }
}
