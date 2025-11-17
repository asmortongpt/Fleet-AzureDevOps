/**
 * FuelEmulator - Realistic fuel transaction emulation
 */

import { EventEmitter } from 'events'
import { Vehicle, FuelTransaction, EmulatorConfig, Location } from '../types'

export class FuelEmulator extends EventEmitter {
  private vehicle: Vehicle
  private config: EmulatorConfig
  private isRunning: boolean = false
  private isPaused: boolean = false
  private updateInterval: NodeJS.Timeout | null = null

  private fuelLevel: number = 75
  private lastFuelStop: number = 0
  private odometer: number = 0

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
        this.checkFuelPurchase()
      }
    }, 60000) // Check every minute

    console.log(`Fuel Emulator started for vehicle ${this.vehicle.id}`)
  }

  public async stop(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
    this.isRunning = false
    console.log(`Fuel Emulator stopped for vehicle ${this.vehicle.id}`)
  }

  public async pause(): Promise<void> { this.isPaused = true }
  public async resume(): Promise<void> { this.isPaused = false }

  public updateFuelLevel(level: number): void {
    this.fuelLevel = level
  }

  public updateOdometer(miles: number): void {
    this.odometer = miles
  }

  private checkFuelPurchase(): void {
    const distanceSinceLastFuel = this.odometer - this.lastFuelStop
    const minDistance = this.config.fuel?.purchaseFrequency?.min || 200
    const maxDistance = this.config.fuel?.purchaseFrequency?.max || 400

    // Generate fuel purchase if fuel is low or distance threshold reached
    if (this.fuelLevel < 20 || (distanceSinceLastFuel > minDistance && Math.random() < 0.1)) {
      this.generateFuelPurchase()
    }
  }

  private generateFuelPurchase(): void {
    const gallonsNeeded = (this.vehicle.tankSize * (100 - this.fuelLevel)) / 100
    const pricePerGallon = this.getFuelPrice()

    const transaction: FuelTransaction = {
      vehicleId: this.vehicle.id,
      timestamp: new Date(),
      stationId: `STATION-${Math.floor(Math.random() * 1000)}`,
      stationName: this.getRandomStation(),
      location: this.getRandomLocation(),
      gallons: Number(gallonsNeeded.toFixed(2)),
      pricePerGallon: Number(pricePerGallon.toFixed(2)),
      totalCost: Number((gallonsNeeded * pricePerGallon).toFixed(2)),
      fuelType: this.vehicle.type === 'ev' ? 'electric' : 'regular',
      paymentMethod: Math.random() > 0.5 ? 'fleet_card' : 'credit',
      odometer: this.odometer,
      receiptNumber: `RCP-${Date.now()}-${Math.floor(Math.random() * 10000)}`
    }

    this.fuelLevel = 95 // Fill up
    this.lastFuelStop = this.odometer

    this.emit('data', transaction)
  }

  private getFuelPrice(): number {
    const config = this.config.fuel?.priceRange || { min: 2.99, max: 4.99, variance: 0.20 }
    const basePrice = Math.random() * (config.max - config.min) + config.min
    const variance = (Math.random() - 0.5) * config.variance
    return Math.max(2.5, basePrice + variance)
  }

  private getRandomStation(): string {
    // NOTE: Hardcoded for emulator/demo mode only
    // PRODUCTION: Should query real fuel station API (Google Places, GasBuddy, etc.)
    // or fetch from database of actual customer fuel stations
    const stations = ['Shell', 'BP', 'Exxon', 'Chevron', 'Mobil', 'Wawa', 'Sunoco']
    return stations[Math.floor(Math.random() * stations.length)]
  }

  private getRandomLocation(): Location {
    return {
      lat: this.vehicle.homeBase.lat + (Math.random() - 0.5) * 0.1,
      lng: this.vehicle.homeBase.lng + (Math.random() - 0.5) * 0.1
    }
  }

  public getCurrentState(): any {
    return {
      fuelLevel: this.fuelLevel,
      lastFuelStop: this.lastFuelStop,
      odometer: this.odometer
    }
  }
}
