export interface DataWorkbenchConfig {
  id: string
  name: string
}

export interface MaintenanceRecord {
  id: string
  vehicleId: string
  date: string
  type: string
  cost: number
  description?: string
}

export interface FuelRecord {
  id: string
  vehicleId: string
  date: string
  gallons: number
  cost: number
  location?: string
}
