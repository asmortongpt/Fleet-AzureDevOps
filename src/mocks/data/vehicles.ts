/**
 * Vehicle Data Generator
 * Generates realistic vehicle data using Faker.js
 */

import { faker } from '@faker-js/faker'

export interface Vehicle {
  id: number
  license_plate: string
  vin: string
  make: string
  model: string
  year: number
  status: 'active' | 'maintenance' | 'inactive' | 'retired'
  mileage: number
  fuel_type: string
  fuel_level?: number
  current_latitude?: number
  current_longitude?: number
  driver?: string
  location?: string
}

const VEHICLE_TYPES = [
  { make: 'Ford', models: ['F-150', 'Transit', 'Explorer', 'Expedition'] },
  { make: 'Chevrolet', models: ['Silverado', 'Tahoe', 'Express', 'Colorado'] },
  { make: 'Ram', models: ['1500', '2500', 'ProMaster', 'ProMaster City'] },
  { make: 'Toyota', models: ['Tacoma', 'Tundra', 'Sienna', 'Highlander'] },
  { make: 'GMC', models: ['Sierra', 'Terrain', 'Acadia', 'Yukon'] },
]

const STATUSES: Vehicle['status'][] = ['active', 'active', 'active', 'maintenance', 'inactive']

// Tallahassee, FL coordinates
const TALLAHASSEE_CENTER = { lat: 30.4383, lng: -84.2807 }

function generateFloridaCoordinates() {
  // Generate coordinates within ~10 miles of Tallahassee
  const latOffset = (Math.random() - 0.5) * 0.3 // ~10 miles
  const lngOffset = (Math.random() - 0.5) * 0.3

  return {
    lat: TALLAHASSEE_CENTER.lat + latOffset,
    lng: TALLAHASSEE_CENTER.lng + lngOffset,
  }
}

function generateVIN(): string {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ123456789'
  return Array.from({ length: 17 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

// Generate 100 vehicles
export const vehicles: Vehicle[] = Array.from({ length: 100 }, (_, i) => {
  const vehicleType = faker.helpers.arrayElement(VEHICLE_TYPES)
  const coords = generateFloridaCoordinates()

  return {
    id: i + 1,
    license_plate: `FL-${String(i + 1).padStart(4, '0')}`,
    vin: generateVIN(),
    make: vehicleType.make,
    model: faker.helpers.arrayElement(vehicleType.models),
    year: faker.number.int({ min: 2015, max: 2024 }),
    status: faker.helpers.arrayElement(STATUSES),
    mileage: faker.number.int({ min: 5000, max: 150000 }),
    fuel_type: faker.helpers.arrayElement(['Gasoline', 'Diesel', 'Hybrid', 'Electric']),
    fuel_level: faker.number.float({ min: 15, max: 95, fractionDigits: 1 }),
    current_latitude: coords.lat,
    current_longitude: coords.lng,
    driver: faker.helpers.maybe(() => faker.person.fullName(), { probability: 0.7 }),
    location: faker.helpers.arrayElement([
      'Downtown Tallahassee',
      'FSU Campus',
      'State Capitol',
      'Tallahassee Airport',
      'Cascades Park',
      'Innovation Park',
      'North Monroe',
      'South Side',
    ]),
  }
})

// Calculate fleet metrics
export function calculateFleetMetrics() {
  const totalVehicles = vehicles.length
  const activeVehicles = vehicles.filter(v => v.status === 'active').length
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length
  const idleVehicles = vehicles.filter(v => v.status === 'inactive').length

  const fuelLevels = vehicles
    .filter(v => v.fuel_level !== undefined)
    .map(v => v.fuel_level!)
  const averageFuelLevel = fuelLevels.length > 0
    ? fuelLevels.reduce((a, b) => a + b, 0) / fuelLevels.length
    : 0

  const totalMileage = vehicles.reduce((sum, v) => sum + v.mileage, 0)

  return {
    totalVehicles,
    activeVehicles,
    maintenanceVehicles,
    idleVehicles,
    averageFuelLevel: Math.round(averageFuelLevel * 10) / 10,
    totalMileage,
  }
}
