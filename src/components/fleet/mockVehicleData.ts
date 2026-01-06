/**
 * Mock Vehicle Data for Fleet Table
 *
 * Realistic fleet data for Capital Transit Alliance
 * Production: Replace with API calls to backend
 */

import type { VehicleRow, Status } from '@/shared/design-system/types'

// Helper to generate randomized but realistic data
function randomStatus(): Status {
  const rand = Math.random()
  if (rand < 0.75) return 'good'
  if (rand < 0.90) return 'warn'
  if (rand < 0.97) return 'info'
  return 'bad'
}

function randomOdometer() {
  return Math.floor(Math.random() * 150000) + 10000
}

function randomFuel() {
  return Math.floor(Math.random() * 100)
}

function randomHealth() {
  const rand = Math.random()
  if (rand < 0.7) return Math.floor(Math.random() * 15) + 85 // 85-100
  if (rand < 0.9) return Math.floor(Math.random() * 25) + 60 // 60-85
  return Math.floor(Math.random() * 30) + 30 // 30-60
}

function randomAlerts() {
  const rand = Math.random()
  if (rand < 0.6) return 0
  if (rand < 0.85) return Math.floor(Math.random() * 3) + 1
  return Math.floor(Math.random() * 8) + 3
}

const timeAgoOptions = ['2m ago', '5m ago', '12m ago', '1h ago', '3h ago', '6h ago', '1d ago']
function randomTimeAgo() {
  return timeAgoOptions[Math.floor(Math.random() * timeAgoOptions.length)]
}

const vehicleTypes = [
  { kind: 'Transit Bus', prefix: 'BUS' },
  { kind: 'Paratransit Van', prefix: 'VAN' },
  { kind: 'Shuttle Bus', prefix: 'SHT' },
  { kind: 'Maintenance Truck', prefix: 'TRK' },
  { kind: 'Supervisor Vehicle', prefix: 'SUP' }
]

export function generateMockVehicles(count: number = 156): VehicleRow[] {
  const vehicles: VehicleRow[] = []

  for (let i = 1; i <= count; i++) {
    const type = vehicleTypes[i % vehicleTypes.length]
    const status = randomStatus()
    const health = randomHealth()

    vehicles.push({
      entityType: 'vehicle',
      id: `vehicle-${i}`,
      displayName: `${type.prefix}-${String(i).padStart(4, '0')}`,
      status,
      kind: type.kind,
      odometer: randomOdometer(),
      fuelPct: randomFuel(),
      healthScore: health,
      alerts: randomAlerts(),
      updatedAgo: randomTimeAgo(),
      badge: health < 60 ? 'Attention' : undefined
    })
  }

  return vehicles
}

// Pre-generate fleet data
export const MOCK_FLEET_VEHICLES = generateMockVehicles(156)

// Filtered subsets
export const ACTIVE_VEHICLES = MOCK_FLEET_VEHICLES.filter((v) => v.status === 'good' || v.status === 'info')
export const MAINTENANCE_VEHICLES = MOCK_FLEET_VEHICLES.filter((v) => v.status === 'warn' || v.status === 'bad')
export const CRITICAL_VEHICLES = MOCK_FLEET_VEHICLES.filter((v) => v.status === 'bad')
