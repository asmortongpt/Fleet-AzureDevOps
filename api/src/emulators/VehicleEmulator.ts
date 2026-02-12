/**
 * Vehicle Data Emulator
 * Generates realistic vehicle data without hardcoding
 * All data dynamically created based on realistic patterns
 */

import { faker } from '@faker-js/faker'

export interface EmulatedVehicle {
  id: number
  vehicleNumber: string
  make: string
  model: string
  year: number
  vin: string
  licensePlate: string
  status: 'active' | 'maintenance' | 'retired'
  mileage: number
  fuelType: string
  location: string
  assignedDriverId?: number
  purchaseDate: Date
  purchasePrice: number
  currentValue: number
  insurancePolicyNumber: string
  registrationExpiry: Date
  inspectionDue: Date
}

const VEHICLE_MAKES = [
  { make: 'Ford', models: ['F-150', 'Transit', 'Explorer', 'Escape', 'Ranger'] },
  { make: 'Chevrolet', models: ['Silverado 1500', 'Colorado', 'Tahoe', 'Suburban', 'Equinox'] },
  { make: 'Toyota', models: ['Tundra', 'Tacoma', 'RAV4', 'Highlander', 'Sienna'] },
  { make: 'Ram', models: ['1500', '2500', '3500', 'ProMaster', 'ProMaster City'] },
  { make: 'GMC', models: ['Sierra 1500', 'Canyon', 'Yukon', 'Terrain', 'Acadia'] },
  { make: 'Nissan', models: ['Frontier', 'Titan', 'NV200', 'NV Cargo', 'Pathfinder'] },
  { make: 'Honda', models: ['Ridgeline', 'CR-V', 'Pilot', 'Odyssey', 'HR-V'] },
  { make: 'Jeep', models: ['Gladiator', 'Wrangler', 'Grand Cherokee', 'Wagoneer', 'Cherokee'] },
]

const FUEL_TYPES = ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'Flex Fuel']

const US_STATES = ['FL', 'CA', 'TX', 'NY', 'PA', 'OH', 'GA', 'NC', 'MI', 'NJ']

export class VehicleEmulator {
  private static instance: VehicleEmulator
  private vehicles: Map<number, EmulatedVehicle> = new Map()
  private nextId = 1

  private constructor() {
    // Initialize with emulated vehicles
    this.generateInitialVehicles(50)
  }

  static getInstance(): VehicleEmulator {
    if (!VehicleEmulator.instance) {
      VehicleEmulator.instance = new VehicleEmulator()
    }
    return VehicleEmulator.instance
  }

  private generateVIN(): string {
    // Generate realistic VIN (17 characters)
    const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'
    let vin = ''
    for (let i = 0; i < 17; i++) {
      vin += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return vin
  }

  private generateLicensePlate(): string {
    const state = US_STATES[Math.floor(Math.random() * US_STATES.length)]
    const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                   String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                   String.fromCharCode(65 + Math.floor(Math.random() * 26))
    const numbers = Math.floor(Math.random() * 9000) + 1000
    return `${state}-${letters}${numbers}`
  }

  private generateVehicle(id: number): EmulatedVehicle {
    const makeData = VEHICLE_MAKES[Math.floor(Math.random() * VEHICLE_MAKES.length)]
    const model = makeData.models[Math.floor(Math.random() * makeData.models.length)]
    const year = faker.date.between({ from: '2018-01-01', to: '2024-12-31' }).getFullYear()
    const age = 2025 - year
    const purchaseDate = faker.date.between({ from: `${year}-01-01`, to: `${year}-12-31` })

    const baseMileage = age * faker.number.int({ min: 8000, max: 18000 })
    const mileage = baseMileage + faker.number.int({ min: 0, max: 5000 })

    const purchasePrice = faker.number.int({ min: 25000, max: 75000 })
    const depreciation = 1 - (age * 0.15)
    const currentValue = Math.max(purchasePrice * depreciation, purchasePrice * 0.3)

    const statuses: Array<'active' | 'maintenance' | 'retired'> = ['active', 'active', 'active', 'active', 'maintenance']
    const status = statuses[Math.floor(Math.random() * statuses.length)]

    return {
      id,
      vehicleNumber: `V-${String(id).padStart(3, '0')}`,
      make: makeData.make,
      model,
      year,
      vin: this.generateVIN(),
      licensePlate: this.generateLicensePlate(),
      status,
      mileage,
      fuelType: FUEL_TYPES[Math.floor(Math.random() * FUEL_TYPES.length)],
      location: faker.location.city() + ', ' + faker.location.state({ abbreviated: true }),
      assignedDriverId: Math.random() > 0.2 ? faker.number.int({ min: 1, max: 50 }) : undefined,
      purchaseDate,
      purchasePrice,
      currentValue: Math.round(currentValue),
      insurancePolicyNumber: faker.string.alphanumeric({ length: 12, casing: 'upper' }),
      registrationExpiry: faker.date.future({ years: 2 }),
      inspectionDue: faker.date.soon({ days: 180 }),
    }
  }

  private generateInitialVehicles(count: number): void {
    for (let i = 0; i < count; i++) {
      const vehicle = this.generateVehicle(this.nextId)
      this.vehicles.set(this.nextId, vehicle)
      this.nextId++
    }
  }

  getAll(): EmulatedVehicle[] {
    return Array.from(this.vehicles.values())
  }

  getById(id: number): EmulatedVehicle | undefined {
    return this.vehicles.get(id)
  }

  create(data: Partial<EmulatedVehicle>): EmulatedVehicle {
    const newVehicle = this.generateVehicle(this.nextId)
    const vehicle = { ...newVehicle, ...data, id: this.nextId }
    this.vehicles.set(this.nextId, vehicle)
    this.nextId++
    return vehicle
  }

  update(id: number, data: Partial<EmulatedVehicle>): EmulatedVehicle | null {
    const vehicle = this.vehicles.get(id)
    if (!vehicle) {
return null
}

    const updated = { ...vehicle, ...data, id }
    this.vehicles.set(id, updated)
    return updated
  }

  delete(id: number): boolean {
    return this.vehicles.delete(id)
  }

  search(query: string): EmulatedVehicle[] {
    const lowerQuery = query.toLowerCase()
    return this.getAll().filter(v =>
      v.vehicleNumber.toLowerCase().includes(lowerQuery) ||
      v.make.toLowerCase().includes(lowerQuery) ||
      v.model.toLowerCase().includes(lowerQuery) ||
      v.vin.toLowerCase().includes(lowerQuery) ||
      v.licensePlate.toLowerCase().includes(lowerQuery)
    )
  }

  filterByStatus(status: string): EmulatedVehicle[] {
    return this.getAll().filter(v => v.status === status)
  }

  // Emulate real-time updates (vehicles change status, mileage increases, etc.)
  emulateRealTimeUpdates(): void {
    setInterval(() => {
      const vehicles = this.getAll()
      const randomVehicle = vehicles[Math.floor(Math.random() * vehicles.length)]

      if (randomVehicle) {
        // Randomly increase mileage
        if (Math.random() > 0.5) {
          randomVehicle.mileage += faker.number.int({ min: 5, max: 50 })
        }

        // Randomly change location for active vehicles
        if (randomVehicle.status === 'active' && Math.random() > 0.7) {
          randomVehicle.location = faker.location.city() + ', ' + faker.location.state({ abbreviated: true })
        }

        this.vehicles.set(randomVehicle.id, randomVehicle)
      }
    }, 30000) // Update every 30 seconds
  }
}

// Export singleton instance
export const vehicleEmulator = VehicleEmulator.getInstance()

// Start real-time emulation
vehicleEmulator.emulateRealTimeUpdates()
