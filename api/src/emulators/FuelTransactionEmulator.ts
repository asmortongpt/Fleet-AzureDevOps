/**
 * Fuel Transaction Data Emulator
 * Generates realistic fuel transaction data without hardcoding
 * All data dynamically created based on realistic patterns
 */

import { faker } from '@faker-js/faker'

import { driverEmulator } from './DriverEmulator'
import { vehicleEmulator } from './VehicleEmulator'

export interface EmulatedFuelTransaction {
  id: number
  vehicleId: number
  vehicleNumber: string
  driverId?: number
  driverName?: string
  date: Date
  gallons: number
  pricePerGallon: number
  totalCost: number
  fuelType: string
  stationName: string
  stationAddress: string
  city: string
  state: string
  odometer: number
  receiptNumber: string
  paymentMethod: 'fleet_card' | 'credit' | 'cash'
  cardLastFour?: string
  location: {
    lat: number
    lng: number
  }
}

const FUEL_STATIONS = [
  'Shell',
  'BP',
  'Exxon',
  'Chevron',
  'Mobil',
  'Wawa',
  'Sunoco',
  '7-Eleven',
  'Circle K',
  'Marathon',
  'Speedway',
  'QuikTrip',
  'RaceTrac',
  'Pilot',
  "Love's Travel Stop"
]

const FUEL_TYPES_MAP: Record<string, string[]> = {
  'Gasoline': ['Regular 87', 'Mid-Grade 89', 'Premium 91', 'Premium 93'],
  'Diesel': ['Diesel', 'Ultra Low Sulfur Diesel'],
  'Electric': ['Electric'], // Not used for fuel transactions, but for consistency
  'Hybrid': ['Regular 87', 'Premium 91'],
  'Flex Fuel': ['Regular 87', 'E85 Flex Fuel']
}

export class FuelTransactionEmulator {
  private static instance: FuelTransactionEmulator
  private transactions: Map<number, EmulatedFuelTransaction> = new Map()
  private nextId = 1

  private constructor() {
    // Initialize with emulated fuel transactions
    this.generateInitialTransactions(200)
  }

  static getInstance(): FuelTransactionEmulator {
    if (!FuelTransactionEmulator.instance) {
      FuelTransactionEmulator.instance = new FuelTransactionEmulator()
    }
    return FuelTransactionEmulator.instance
  }

  private generateReceiptNumber(): string {
    const prefix = 'RCP'
    const timestamp = Date.now().toString().slice(-8)
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `${prefix}-${timestamp}-${random}`
  }

  private getFuelPriceForType(fuelType: string): number {
    // Realistic fuel prices per gallon (as of 2024-2025)
    const basePrices: Record<string, { min: number; max: number }> = {
      'Regular 87': { min: 2.89, max: 3.89 },
      'Mid-Grade 89': { min: 3.19, max: 4.19 },
      'Premium 91': { min: 3.49, max: 4.49 },
      'Premium 93': { min: 3.69, max: 4.69 },
      'Diesel': { min: 3.29, max: 4.29 },
      'Ultra Low Sulfur Diesel': { min: 3.39, max: 4.39 },
      'E85 Flex Fuel': { min: 2.49, max: 3.49 }
    }

    const priceRange = basePrices[fuelType] || { min: 2.99, max: 3.99 }
    const basePrice = faker.number.float({
      min: priceRange.min,
      max: priceRange.max,
      multipleOf: 0.01
    })

    // Add small variance for realism
    const variance = faker.number.float({ min: -0.10, max: 0.10, multipleOf: 0.01 })
    return Math.max(2.50, Number((basePrice + variance).toFixed(2)))
  }

  private getGallonsForVehicle(vehicleFuelType: string): number {
    // Realistic fuel purchases based on vehicle type
    const tankSizes: Record<string, { min: number; max: number }> = {
      'Gasoline': { min: 8, max: 26 }, // Partial to full tank
      'Diesel': { min: 15, max: 40 }, // Larger tanks for diesel trucks
      'Hybrid': { min: 6, max: 14 }, // Smaller tanks
      'Flex Fuel': { min: 10, max: 28 }
    }

    const range = tankSizes[vehicleFuelType] || { min: 10, max: 25 }
    return faker.number.float({ min: range.min, max: range.max, multipleOf: 0.01 })
  }

  private generateTransaction(id: number): EmulatedFuelTransaction {
    // Get a random vehicle
    const vehicles = vehicleEmulator.getAll()
    const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)]

    // Skip electric vehicles (they don't buy gas)
    if (vehicle.fuelType === 'Electric') {
      // Try again with a different vehicle
      const nonElectricVehicles = vehicles.filter(v => v.fuelType !== 'Electric')
      if (nonElectricVehicles.length > 0) {
        const retryVehicle = nonElectricVehicles[Math.floor(Math.random() * nonElectricVehicles.length)]
        return this.generateTransactionForVehicle(id, retryVehicle)
      }
    }

    return this.generateTransactionForVehicle(id, vehicle)
  }

  private generateTransactionForVehicle(id: number, vehicle: any): EmulatedFuelTransaction {
    // Get driver if assigned
    const driverId = vehicle.assignedDriverId
    let driverName: string | undefined

    if (driverId) {
      const driver = driverEmulator.getById(driverId)
      if (driver) {
        driverName = `${driver.firstName} ${driver.lastName}`
      }
    }

    // Select appropriate fuel type for this vehicle
    const vehicleFuelTypes = FUEL_TYPES_MAP[vehicle.fuelType] || FUEL_TYPES_MAP['Gasoline']
    const fuelType = vehicleFuelTypes[Math.floor(Math.random() * vehicleFuelTypes.length)]

    // Generate transaction details
    const gallons = this.getGallonsForVehicle(vehicle.fuelType)
    const pricePerGallon = this.getFuelPriceForType(fuelType)
    const totalCost = Number((gallons * pricePerGallon).toFixed(2))

    // Random date within last 90 days
    const date = faker.date.recent({ days: 90 })

    // Random station
    const stationName = FUEL_STATIONS[Math.floor(Math.random() * FUEL_STATIONS.length)]
    const streetAddress = faker.location.streetAddress()
    const city = faker.location.city()
    const state = faker.location.state({ abbreviated: true })

    // Payment method
    const paymentMethods: Array<'fleet_card' | 'credit' | 'cash'> = ['fleet_card', 'fleet_card', 'fleet_card', 'credit', 'cash']
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)]
    const cardLastFour = (paymentMethod === 'fleet_card' || paymentMethod === 'credit')
      ? Math.floor(1000 + Math.random() * 9000).toString()
      : undefined

    // Odometer reading (should be consistent with vehicle mileage)
    const odometer = vehicle.mileage - faker.number.int({ min: 0, max: 5000 })

    return {
      id,
      vehicleId: vehicle.id,
      vehicleNumber: vehicle.vehicleNumber,
      driverId,
      driverName,
      date,
      gallons: Number(gallons.toFixed(2)),
      pricePerGallon,
      totalCost,
      fuelType,
      stationName,
      stationAddress: streetAddress,
      city,
      state,
      odometer: Math.max(0, odometer),
      receiptNumber: this.generateReceiptNumber(),
      paymentMethod,
      cardLastFour,
      location: {
        lat: faker.location.latitude(),
        lng: faker.location.longitude()
      }
    }
  }

  private generateInitialTransactions(count: number): void {
    for (let i = 0; i < count; i++) {
      const transaction = this.generateTransaction(this.nextId)
      this.transactions.set(this.nextId, transaction)
      this.nextId++
    }
  }

  getAll(): EmulatedFuelTransaction[] {
    // Sort by date descending (newest first)
    return Array.from(this.transactions.values()).sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  getById(id: number): EmulatedFuelTransaction | undefined {
    return this.transactions.get(id)
  }

  create(data: Partial<EmulatedFuelTransaction>): EmulatedFuelTransaction {
    const newTransaction = this.generateTransaction(this.nextId)
    const transaction = { ...newTransaction, ...data, id: this.nextId }
    this.transactions.set(this.nextId, transaction)
    this.nextId++
    return transaction
  }

  update(id: number, data: Partial<EmulatedFuelTransaction>): EmulatedFuelTransaction | null {
    const transaction = this.transactions.get(id)
    if (!transaction) return null

    const updated = { ...transaction, ...data, id }
    this.transactions.set(id, updated)
    return updated
  }

  delete(id: number): boolean {
    return this.transactions.delete(id)
  }

  search(query: string): EmulatedFuelTransaction[] {
    const lowerQuery = query.toLowerCase()
    return this.getAll().filter(t =>
      t.vehicleNumber.toLowerCase().includes(lowerQuery) ||
      t.driverName?.toLowerCase().includes(lowerQuery) ||
      t.stationName.toLowerCase().includes(lowerQuery) ||
      t.city.toLowerCase().includes(lowerQuery) ||
      t.state.toLowerCase().includes(lowerQuery) ||
      t.receiptNumber.toLowerCase().includes(lowerQuery) ||
      t.fuelType.toLowerCase().includes(lowerQuery)
    )
  }

  filterByVehicle(vehicleId: number): EmulatedFuelTransaction[] {
    return this.getAll().filter(t => t.vehicleId === vehicleId)
  }

  filterByDriver(driverId: number): EmulatedFuelTransaction[] {
    return this.getAll().filter(t => t.driverId === driverId)
  }

  filterByDateRange(startDate: Date, endDate: Date): EmulatedFuelTransaction[] {
    return this.getAll().filter(t =>
      t.date >= startDate && t.date <= endDate
    )
  }

  filterByPaymentMethod(method: string): EmulatedFuelTransaction[] {
    return this.getAll().filter(t => t.paymentMethod === method)
  }

  // Emulate new transactions being created
  emulateRealTimeTransactions(): void {
    setInterval(() => {
      // 30% chance to create a new transaction
      if (Math.random() > 0.7) {
        const transaction = this.generateTransaction(this.nextId)
        this.transactions.set(this.nextId, transaction)
        this.nextId++
        console.log(`[FuelEmulator] New transaction created: ${transaction.receiptNumber}`)
      }
    }, 60000) // Check every minute
  }
}

// Export singleton instance
export const fuelTransactionEmulator = FuelTransactionEmulator.getInstance()

// Start real-time emulation
fuelTransactionEmulator.emulateRealTimeTransactions()
