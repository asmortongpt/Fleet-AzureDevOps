/**
 * Driver Data Emulator
 * Generates realistic driver data dynamically
 * No hardcoded data - all generated from patterns
 */

import { faker } from '@faker-js/faker'

export interface EmulatedDriver {
  id: number
  name: string
  email: string
  phone: string
  licenseNumber: string
  licenseExpiry: Date
  licenseClass: string
  status: 'active' | 'inactive' | 'suspended'
  photoUrl?: string
  azureAdId?: string
  assignedVehicleId?: number
  rating: number
  totalTrips: number
  totalMiles: number
  safetyScore: number
  hireDate: Date
}

const LICENSE_CLASSES = ['A', 'B', 'C', 'D', 'CDL-A', 'CDL-B']

export class DriverEmulator {
  private static instance: DriverEmulator
  private drivers: Map<number, EmulatedDriver> = new Map()
  private nextId = 1

  private constructor() {
    this.generateInitialDrivers(50)
  }

  static getInstance(): DriverEmulator {
    if (!DriverEmulator.instance) {
      DriverEmulator.instance = new DriverEmulator()
    }
    return DriverEmulator.instance
  }

  private generateLicenseNumber(): string {
    return faker.string.alphanumeric({ length: 8, casing: 'upper' })
  }

  private generateDriver(id: number): EmulatedDriver {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const hireDate = faker.date.past({ years: 10 })
    const yearsEmployed = (Date.now() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365)

    const totalTrips = Math.floor(yearsEmployed * faker.number.int({ min: 100, max: 500 }))
    const totalMiles = Math.floor(totalTrips * faker.number.int({ min: 20, max: 200 }))

    return {
      id,
      name: `${firstName} ${lastName}`,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      phone: faker.phone.number(),
      licenseNumber: this.generateLicenseNumber(),
      licenseExpiry: faker.date.future({ years: 5 }),
      licenseClass: LICENSE_CLASSES[Math.floor(Math.random() * LICENSE_CLASSES.length)],
      status: Math.random() > 0.15 ? 'active' : (Math.random() > 0.5 ? 'inactive' : 'suspended'),
      photoUrl: `https://i.pravatar.cc/150?u=${id}`, // Emulated avatar service
      assignedVehicleId: Math.random() > 0.2 ? faker.number.int({ min: 1, max: 50 }) : undefined,
      rating: Number((Math.random() * 1.5 + 3.5).toFixed(2)), // 3.5 to 5.0
      totalTrips,
      totalMiles,
      safetyScore: faker.number.int({ min: 75, max: 100 }),
      hireDate,
    }
  }

  private generateInitialDrivers(count: number): void {
    for (let i = 0; i < count; i++) {
      const driver = this.generateDriver(this.nextId)
      this.drivers.set(this.nextId, driver)
      this.nextId++
    }
  }

  getAll(): EmulatedDriver[] {
    return Array.from(this.drivers.values())
  }

  getById(id: number): EmulatedDriver | undefined {
    return this.drivers.get(id)
  }

  create(data: Partial<EmulatedDriver>): EmulatedDriver {
    const newDriver = this.generateDriver(this.nextId)
    const driver = { ...newDriver, ...data, id: this.nextId }
    this.drivers.set(this.nextId, driver)
    this.nextId++
    return driver
  }

  update(id: number, data: Partial<EmulatedDriver>): EmulatedDriver | null {
    const driver = this.drivers.get(id)
    if (!driver) {
return null
}

    const updated = { ...driver, ...data, id }
    this.drivers.set(id, updated)
    return updated
  }

  delete(id: number): boolean {
    return this.drivers.delete(id)
  }

  search(query: string): EmulatedDriver[] {
    const lowerQuery = query.toLowerCase()
    return this.getAll().filter(d =>
      d.name.toLowerCase().includes(lowerQuery) ||
      d.email.toLowerCase().includes(lowerQuery) ||
      d.licenseNumber.toLowerCase().includes(lowerQuery)
    )
  }

  // Emulate real-time driver updates (trips completed, rating changes)
  emulateRealTimeUpdates(): void {
    setInterval(() => {
      const drivers = this.getAll().filter(d => d.status === 'active')
      if (drivers.length === 0) {
return
}

      const randomDriver = drivers[Math.floor(Math.random() * drivers.length)]

      // Simulate completing a trip
      if (Math.random() > 0.6) {
        randomDriver.totalTrips += 1
        randomDriver.totalMiles += faker.number.int({ min: 10, max: 150 })

        // Slight rating fluctuation
        const ratingChange = (Math.random() - 0.5) * 0.1
        randomDriver.rating = Math.min(5.0, Math.max(1.0, randomDriver.rating + ratingChange))
        randomDriver.rating = Number(randomDriver.rating.toFixed(2))

        this.drivers.set(randomDriver.id, randomDriver)
      }
    }, 45000) // Update every 45 seconds
  }
}

export const driverEmulator = DriverEmulator.getInstance()
driverEmulator.emulateRealTimeUpdates()
